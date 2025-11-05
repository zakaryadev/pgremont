import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface ExpensePaymentRecord {
  id: string;
  expenseId: string;
  amount: number;
  paymentType: 'advance' | 'payment';
  description: string;
  paymentDate: string;
  paymentMethod?: 'cash' | 'click' | 'transfer';
  createdAt: Date;
  updatedAt: Date;
}

export function useExpensePaymentRecords() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePaymentRecords = useCallback(async (expenseId: string, paymentRecords: Omit<ExpensePaymentRecord, 'id' | 'expenseId' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // First, verify that the expense exists
      const { data: expenseExists, error: expenseCheckError } = await supabase
        .from('daily_expenses')
        .select('id')
        .eq('id', expenseId);

      if (expenseCheckError) {
        throw expenseCheckError;
      }

      if (!expenseExists || expenseExists.length === 0) {
        throw new Error(`Expense with ID ${expenseId} does not exist in the database`);
      }
      
      // Get all existing payment records BEFORE inserting new ones (excluding advance) to calculate total paid
      const { data: existingPayments, error: existingPaymentsError } = await supabase
        .from('expense_payment_records')
        .select('amount, payment_type')
        .eq('expense_id', expenseId);

      if (existingPaymentsError) {
        throw existingPaymentsError;
      }

      // Convert payment records to database format
      const recordsToInsert = paymentRecords.map(record => ({
        expense_id: expenseId,
        amount: record.amount,
        payment_type: record.paymentType,
        description: record.description,
        payment_date: record.paymentDate,
        payment_method: record.paymentMethod || 'cash'
      }));

      const { data, error: insertError } = await (supabase as any)
        .from('expense_payment_records')
        .insert(recordsToInsert)
        .select();

      if (insertError) {
        throw insertError;
      }

      // Calculate existing payments (excluding advance) - these are payments made before the new ones
      const existingPaymentTotal = (existingPayments || []).reduce((sum: number, record: any) => {
        if (record.payment_type !== 'advance') {
          return sum + parseFloat(record.amount || 0);
        }
        return sum;
      }, 0);

      // Calculate new payment total
      const newPaymentTotal = paymentRecords.reduce((sum, record) => sum + record.amount, 0);
      
      // Get the current expense to calculate remaining balance properly
      const { data: currentExpenseData, error: fetchError } = await supabase
        .from('daily_expenses')
        .select('amount, advance_payment')
        .eq('id', expenseId);

      if (fetchError) {
        throw fetchError;
      }

      if (!currentExpenseData || currentExpenseData.length === 0) {
        throw new Error('Expense not found');
      }

      const currentExpense = currentExpenseData[0];

      const totalAmount = parseFloat((currentExpense as any).amount);
      const originalAdvance = parseFloat((currentExpense as any).advance_payment);
      // Total paid = advance + existing payments (before new ones) + new payments
      const totalPaid = originalAdvance + existingPaymentTotal + newPaymentTotal;
      const remainingBalance = Math.max(0, totalAmount - totalPaid);
      
      const { error: updateError } = await (supabase as any)
        .from('daily_expenses')
        .update({ remaining_balance: remainingBalance })
        .eq('id', expenseId);

      if (updateError) {
        throw updateError;
      }

      return data;
    } catch (err) {
      console.error('Failed to save expense payment records:', err);
      setError(err instanceof Error ? err.message : 'Failed to save expense payment records');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentRecords = useCallback(async (expenseId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('expense_payment_records')
        .select('*')
        .eq('expense_id', expenseId)
        .order('payment_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const formattedRecords: ExpensePaymentRecord[] = (data || []).map((record: any) => ({
        id: record.id,
        expenseId: record.expense_id,
        amount: parseFloat(record.amount),
        paymentType: record.payment_type,
        description: record.description,
        paymentDate: record.payment_date,
        paymentMethod: record.payment_method || 'cash',
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      }));

      return formattedRecords;
    } catch (err) {
      console.error('Failed to get expense payment records:', err);
      setError(err instanceof Error ? err.message : 'Failed to get expense payment records');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePaymentRecord = useCallback(async (recordId: string) => {
    try {
      setError(null);
      
      // First, get the payment record to find the expense_id
      const { data: paymentRecord, error: fetchError } = await supabase
        .from('expense_payment_records')
        .select('expense_id, amount')
        .eq('id', recordId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      if (!paymentRecord) {
        throw new Error('Payment record not found');
      }

      const expenseId = (paymentRecord as any).expense_id;
      
      // Delete the payment record
      const { error: deleteError } = await supabase
        .from('expense_payment_records')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        throw deleteError;
      }

      // Recalculate and update remaining_balance after deletion
      const { data: existingPayments, error: existingPaymentsError } = await supabase
        .from('expense_payment_records')
        .select('amount, payment_type')
        .eq('expense_id', expenseId);

      if (existingPaymentsError) {
        throw existingPaymentsError;
      }

      // Get expense data
      const { data: currentExpenseData, error: expenseFetchError } = await supabase
        .from('daily_expenses')
        .select('amount, advance_payment')
        .eq('id', expenseId);

      if (expenseFetchError) {
        throw expenseFetchError;
      }

      if (!currentExpenseData || currentExpenseData.length === 0) {
        throw new Error('Expense not found');
      }

      const currentExpense = currentExpenseData[0];
      const totalAmount = parseFloat((currentExpense as any).amount);
      const originalAdvance = parseFloat((currentExpense as any).advance_payment);

      // Calculate total paid (excluding advance from payment records, advance is separate)
      const existingPaymentTotal = (existingPayments || []).reduce((sum: number, record: any) => {
        if (record.payment_type !== 'advance') {
          return sum + parseFloat(record.amount || 0);
        }
        return sum;
      }, 0);

      const totalPaid = originalAdvance + existingPaymentTotal;
      const remainingBalance = Math.max(0, totalAmount - totalPaid);

      // Update remaining_balance
      const { error: updateError } = await (supabase as any)
        .from('daily_expenses')
        .update({ remaining_balance: remainingBalance })
        .eq('id', expenseId);

      if (updateError) {
        throw updateError;
      }
    } catch (err) {
      console.error('Failed to delete expense payment record:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete expense payment record');
      throw err;
    }
  }, []);

  return {
    loading,
    error,
    savePaymentRecords,
    getPaymentRecords,
    deletePaymentRecord
  };
}


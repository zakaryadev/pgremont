import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyExpense {
  id: string;
  name: string;
  description?: string;
  totalAmount: number;
  paymentType: 'cash' | 'click' | 'transfer';
  advancePayment: number;
  remainingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useDailyExpenses() {
  const [items, setItems] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('daily_expenses')
        .select(`
          *,
          expense_payment_records (
            amount,
            payment_type
          )
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows: any[] = data || [];
      const mapped: DailyExpense[] = rows.map((r: any) => {
        const originalAdvance = parseFloat(r.advance_payment || 0);
        
        // Calculate additional payments (excluding advance)
        const additionalPayments = r.expense_payment_records?.reduce((sum: number, record: any) => {
          if (record.payment_type !== 'advance') {
            return sum + parseFloat(record.amount || 0);
          }
          return sum;
        }, 0) || 0;
        
        const totalPaid = originalAdvance + additionalPayments;
        const totalAmount = parseFloat(r.amount || 0);
        const remainingBalance = Math.max(0, totalAmount - totalPaid);
        
        return {
          id: r.id,
          name: r.name,
          description: r.description || '',
          totalAmount,
          paymentType: r.payment_type || 'cash',
          advancePayment: originalAdvance,
          remainingBalance,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        };
      });
      setItems(mapped);
    } catch (e: any) {
      setError(e?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = useCallback(async (payload: {
    name: string;
    description?: string;
    totalAmount: number;
    paymentType: 'cash' | 'click' | 'transfer';
    advancePayment: number;
  }) => {
    const calculatedRemaining = Math.max(0, payload.totalAmount - payload.advancePayment);
    
    const insertBody: any = {
      user_id: null, // Custom auth doesn't use Supabase auth, so user_id is null
      name: payload.name,
      description: payload.description ?? null,
      amount: payload.totalAmount,
      payment_type: payload.paymentType,
      advance_payment: payload.advancePayment,
      remaining_balance: calculatedRemaining,
    };
    
    const { data, error } = await (supabase as any)
      .from('daily_expenses')
      .insert([insertBody])
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('No data returned from insert');
    
    // If there's an advance payment, create a payment record
    if (payload.advancePayment > 0) {
      try {
        const paymentRecordData = {
          expense_id: data.id,
          amount: payload.advancePayment,
          payment_type: 'advance',
          description: "Dastlabki avans to'lovi",
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: payload.paymentType,
        };
        
        await (supabase as any)
          .from('expense_payment_records')
          .insert([paymentRecordData]);
      } catch (paymentError) {
        console.warn('Failed to create advance payment record:', paymentError);
      }
    }
    
    const mapped: DailyExpense = {
      id: data.id,
      name: data.name,
      description: (data as any).description || '',
      totalAmount: parseFloat(data.amount),
      paymentType: data.payment_type,
      advancePayment: parseFloat(data.advance_payment),
      remainingBalance: parseFloat(data.remaining_balance),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
    setItems((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const update = useCallback(async (id: string, payload: Partial<{
    name: string;
    description?: string;
    totalAmount: number;
    paymentType: 'cash' | 'click' | 'transfer';
    advancePayment: number;
  }>) => {
    const updateBody: any = {};
    if (payload.name !== undefined) updateBody.name = payload.name;
    if (payload.description !== undefined) updateBody.description = payload.description;
    if (payload.totalAmount !== undefined) updateBody.amount = payload.totalAmount;
    if (payload.paymentType !== undefined) updateBody.payment_type = payload.paymentType;
    if (payload.advancePayment !== undefined) updateBody.advance_payment = payload.advancePayment;
    
    // Recalculate remaining balance if amount or advance changes
    if (payload.totalAmount !== undefined || payload.advancePayment !== undefined) {
      // Get current expense to calculate properly
      const current = items.find(x => x.id === id);
      const totalAmount = payload.totalAmount ?? current?.totalAmount ?? 0;
      const advancePayment = payload.advancePayment ?? current?.advancePayment ?? 0;
      updateBody.remaining_balance = Math.max(0, totalAmount - advancePayment);
    }
    
    const { data, error } = await (supabase as any)
      .from('daily_expenses')
      .update(updateBody)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    if (!data) throw new Error('No data returned from update');
    
    const row: any = data;
    const mapped: DailyExpense = {
      id: row.id,
      name: row.name,
      description: row.description || '',
      totalAmount: parseFloat(row.amount),
      paymentType: row.payment_type,
      advancePayment: parseFloat(row.advance_payment),
      remainingBalance: parseFloat(row.remaining_balance),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
    
    // Reload to get updated payment records
    await load();
    return mapped;
  }, [items, load]);

  const remove = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('daily_expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { items, loading, error, load, add, update, remove };
}



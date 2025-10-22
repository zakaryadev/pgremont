import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  paymentType: 'advance' | 'payment';
  description: string;
  paymentDate: string;
  createdAt: Date;
  updatedAt: Date;
}

export function usePaymentRecords() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const savePaymentRecords = useCallback(async (orderId: string, paymentRecords: Omit<PaymentRecord, 'id' | 'orderId' | 'createdAt' | 'updatedAt'>[]) => {
    try {
      setLoading(true);
      setError(null);
      
      // First, verify that the order exists
      const { data: orderExists, error: orderCheckError } = await supabase
        .from('customer_orders')
        .select('id')
        .eq('id', orderId);

      if (orderCheckError) {
        throw orderCheckError;
      }

      if (!orderExists || orderExists.length === 0) {
        throw new Error(`Order with ID ${orderId} does not exist in the database`);
      }
      
      // Convert payment records to database format
      const recordsToInsert = paymentRecords.map(record => ({
        order_id: orderId,
        amount: record.amount,
        payment_type: record.paymentType,
        description: record.description,
        payment_date: record.paymentDate
      }));

      const { data, error: insertError } = await supabase
        .from('payment_records')
        .insert(recordsToInsert as any)
        .select();

      if (insertError) {
        throw insertError;
      }

      // Don't update advance_payment - it should remain as the original advance
      // Only update remaining_balance based on total payments
      const newPaymentTotal = paymentRecords.reduce((sum, record) => sum + record.amount, 0);
      
      // Get the current order to calculate remaining balance properly
      const { data: currentOrderData, error: fetchError } = await supabase
        .from('customer_orders')
        .select('total_amount, advance_payment')
        .eq('id', orderId);

      if (fetchError) {
        throw fetchError;
      }

      if (!currentOrderData || currentOrderData.length === 0) {
        throw new Error('Order not found');
      }

      const currentOrder = currentOrderData[0];

      const totalAmount = parseFloat((currentOrder as any).total_amount);
      const originalAdvance = parseFloat((currentOrder as any).advance_payment);
      const totalPaid = originalAdvance + newPaymentTotal;
      const remainingBalance = Math.max(0, totalAmount - totalPaid);
      
      const { error: updateError } = await supabase
        .from('customer_orders')
        .update({ remaining_balance: remainingBalance } as any)
        .eq('id', orderId);

      if (updateError) {
        throw updateError;
      }

      return data;
    } catch (err) {
      console.error('Failed to save payment records:', err);
      setError(err instanceof Error ? err.message : 'Failed to save payment records');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentRecords = useCallback(async (orderId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('payment_records')
        .select('*')
        .eq('order_id', orderId)
        .order('payment_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const formattedRecords: PaymentRecord[] = (data || []).map((record: any) => ({
        id: record.id,
        orderId: record.order_id,
        amount: parseFloat(record.amount),
        paymentType: record.payment_type,
        description: record.description,
        paymentDate: record.payment_date,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      }));

      return formattedRecords;
    } catch (err) {
      console.error('Failed to get payment records:', err);
      setError(err instanceof Error ? err.message : 'Failed to get payment records');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePaymentRecord = useCallback(async (recordId: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('payment_records')
        .delete()
        .eq('id', recordId);

      if (deleteError) {
        throw deleteError;
      }
    } catch (err) {
      console.error('Failed to delete payment record:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete payment record');
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

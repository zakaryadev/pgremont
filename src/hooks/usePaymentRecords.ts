import { useState, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface PaymentRecord {
  id: string;
  orderId: string;
  amount: number;
  paymentType: 'advance' | 'payment';
  description: string;
  paymentDate: string;
  paymentMethod?: 'cash' | 'click' | 'transfer';
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

export function usePaymentRecords() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

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
      const isManager = user?.role === 'manager';
      const recordsToInsert = paymentRecords.map(record => ({
        order_id: orderId,
        amount: record.amount,
        payment_type: record.paymentType,
        description: record.description,
        payment_date: record.paymentDate,
        payment_method: record.paymentMethod || 'cash',
        status: isManager ? 'pending' : 'approved'
      }));

      const { data, error: insertError } = await supabase
        .from('payment_records')
        .insert(recordsToInsert as any)
        .select();

      if (insertError) {
        throw insertError;
      }

      // After inserting, recalculate remaining_balance from APPROVED records only
      // Get the current order amounts
      const { data: currentOrderData, error: fetchError } = await supabase
        .from('customer_orders')
        .select('total_amount')
        .eq('id', orderId);

      if (fetchError) {
        throw fetchError;
      }

      if (!currentOrderData || currentOrderData.length === 0) {
        throw new Error('Order not found');
      }

      const currentOrder = currentOrderData[0];
      const totalAmount = parseFloat((currentOrder as any).total_amount);

      // Sum approved payments (including approved advance)
      const { data: approvedRecords, error: prErr } = await supabase
        .from('payment_records')
        .select('amount, payment_type, status')
        .eq('order_id', orderId)
        .eq('status', 'approved');
      if (prErr) throw prErr;

      const { approvedAdvance, approvedPayments } = (approvedRecords || []).reduce(
        (acc: { approvedAdvance: number; approvedPayments: number }, r: any) => {
          const amt = parseFloat(r.amount);
          if (r.payment_type === 'advance') acc.approvedAdvance += amt;
          else acc.approvedPayments += amt;
          return acc;
        },
        { approvedAdvance: 0, approvedPayments: 0 }
      );

      const totalPaidApproved = approvedAdvance + approvedPayments;
      const remainingBalance = Math.max(0, totalAmount - totalPaidApproved);
      
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
        paymentMethod: record.payment_method || 'cash',
        status: (record as any).status,
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

  const updatePaymentRecordStatus = useCallback(async (recordId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      setError(null);
      setLoading(true);

      // Update status
      const { data, error: updateErr } = await supabase
        .from('payment_records')
        .update({ status } as any)
        .eq('id', recordId)
        .select('order_id')
        .single();
      if (updateErr) throw updateErr;

      const orderId = (data as any)?.order_id;
      if (orderId) {
        // Recompute remaining balance from approved payments only
        const { data: orderData, error: odErr } = await supabase
          .from('customer_orders')
          .select('total_amount')
          .eq('id', orderId)
          .single();
        if (odErr) throw odErr;
        const totalAmount = parseFloat((orderData as any).total_amount);

        const { data: approvedRecords, error: prErr } = await supabase
          .from('payment_records')
          .select('amount, payment_type')
          .eq('order_id', orderId)
          .eq('status', 'approved');
        if (prErr) throw prErr;

        const totals = (approvedRecords || []).reduce(
          (acc: { adv: number; pay: number }, r: any) => {
            const amt = parseFloat(r.amount);
            if (r.payment_type === 'advance') acc.adv += amt; else acc.pay += amt;
            return acc;
          },
          { adv: 0, pay: 0 }
        );

        const remaining = Math.max(0, totalAmount - (totals.adv + totals.pay));
        const { error: updErr2 } = await supabase
          .from('customer_orders')
          .update({ remaining_balance: remaining } as any)
          .eq('id', orderId);
        if (updErr2) throw updErr2;
      }
    } catch (err) {
      console.error('Failed to update payment record status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update payment record status');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    savePaymentRecords,
    getPaymentRecords,
    deletePaymentRecord,
    updatePaymentRecordStatus,
  };
}

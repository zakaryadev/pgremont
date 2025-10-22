import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface CustomerOrder {
  id: string;
  customerName: string;
  phoneNumber?: string;
  totalAmount: number;
  paymentType: 'cash' | 'click' | 'transfer';
  advancePayment: number;
  remainingBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useCustomerOrders() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('customer_orders')
        .select(`
          *,
          payment_records (
            amount,
            payment_type
          )
        `)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const formattedOrders: CustomerOrder[] = (data || []).map((order: any) => {
        // Calculate total paid: original advance + payment records
        const originalAdvance = parseFloat(order.advance_payment);
        const additionalPayments = order.payment_records?.reduce((sum: number, record: any) => 
          sum + parseFloat(record.amount), 0) || 0;
        const totalPaid = originalAdvance + additionalPayments;
        
        // Calculate remaining balance
        const totalAmount = parseFloat(order.total_amount);
        const remainingBalance = totalAmount - totalPaid;

        return {
          id: order.id,
          customerName: order.customer_name,
          phoneNumber: order.phone_number || undefined,
          totalAmount: totalAmount,
          paymentType: order.payment_type,
          advancePayment: parseFloat(order.advance_payment), // Use original advance_payment from database
          remainingBalance: Math.max(0, remainingBalance), // Ensure non-negative
          createdAt: new Date(order.created_at),
          updatedAt: new Date(order.updated_at)
        };
      });

      setOrders(formattedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customer orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const saveOrder = useCallback(async (
    customerName: string,
    phoneNumber: string,
    totalAmount: number,
    paymentType: 'cash' | 'click' | 'transfer',
    advancePayment: number,
    remainingBalance: number
  ) => {
    try {
      setError(null);
      
      const orderData = {
        customer_name: customerName,
        phone_number: phoneNumber || null,
        total_amount: totalAmount,
        payment_type: paymentType,
        advance_payment: advancePayment,
        remaining_balance: remainingBalance
      };

      const { data, error: insertError } = await supabase
        .from('customer_orders')
        .insert([orderData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      const newOrder: CustomerOrder = {
        id: data.id,
        customerName: data.customer_name,
        phoneNumber: data.phone_number || undefined,
        totalAmount: parseFloat(data.total_amount),
        paymentType: data.payment_type,
        advancePayment: parseFloat(data.advance_payment),
        remainingBalance: parseFloat(data.remaining_balance),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      console.error('Failed to save customer order to Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to save customer order');
      throw err;
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('customer_orders')
        .delete()
        .eq('id', orderId);

      if (deleteError) {
        throw deleteError;
      }

      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Failed to delete customer order:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete customer order');
      throw err;
    }
  }, []);

  const updateOrder = useCallback(async (orderId: string, updatedData: Partial<CustomerOrder>) => {
    try {
      setError(null);
      
      const { data, error: updateError } = await supabase
        .from('customer_orders')
        .update({
          customer_name: updatedData.customerName,
          phone_number: updatedData.phoneNumber || null,
          total_amount: updatedData.totalAmount,
          payment_type: updatedData.paymentType,
          advance_payment: updatedData.advancePayment,
          remaining_balance: updatedData.remainingBalance
        })
        .eq('id', orderId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      if (!data) {
        throw new Error('No data returned from update operation');
      }

      const updatedOrder: CustomerOrder = {
        id: data.id,
        customerName: data.customer_name,
        phoneNumber: data.phone_number || undefined,
        totalAmount: parseFloat(data.total_amount),
        paymentType: data.payment_type,
        advancePayment: parseFloat(data.advance_payment),
        remainingBalance: parseFloat(data.remaining_balance),
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      setOrders(prev => prev.map(order => 
        order.id === orderId ? updatedOrder : order
      ));

      return updatedOrder;
    } catch (err) {
      console.error('Failed to update customer order:', err);
      setError(err instanceof Error ? err.message : 'Failed to update customer order');
      throw err;
    }
  }, []);

  const clearAllOrders = useCallback(async () => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('customer_orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

      if (deleteError) {
        throw deleteError;
      }

      setOrders([]);
    } catch (err) {
      console.error('Failed to clear all customer orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear all customer orders');
      throw err;
    }
  }, []);

  const refreshOrders = useCallback(() => {
    loadOrders();
  }, [loadOrders]);

  return {
    orders,
    loading,
    error,
    saveOrder,
    updateOrder,
    deleteOrder,
    clearAllOrders,
    refreshOrders
  };
}

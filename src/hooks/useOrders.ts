import { useState, useEffect, useCallback } from 'react';
import { Order, CalculatorState, CalculationResults, Material, Service } from '../types/calculator';
import { supabase } from '../integrations/supabase/client';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const formattedOrders: Order[] = (data || []).map((order: any) => ({
        id: order.id,
        name: order.name,
        phone: order.phone || undefined,
        createdAt: new Date(order.created_at),
        state: order.state,
        results: order.results,
        materials: order.materials,
        services: order.services
      }));

      setOrders(formattedOrders);
    } catch (err) {
      console.error('Failed to load orders from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load orders from Supabase on mount
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const saveOrder = useCallback(async (
    name: string,
    state: CalculatorState,
    results: CalculationResults,
    materials: Record<string, Material>,
    services: Record<string, Service>,
    phone?: string
  ) => {
    try {
      setError(null);
      
      const orderData = {
        name,
        phone,
        state,
        results,
        materials,
        services
      };

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newOrder: Order = {
        id: data.id,
        name: data.name,
        phone: data.phone || undefined,
        createdAt: new Date(data.created_at),
        state: data.state,
        results: data.results,
        materials: data.materials,
        services: data.services
      };

      setOrders(prev => [newOrder, ...prev]);
      return newOrder;
    } catch (err) {
      console.error('Failed to save order to Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to save order');
      throw err;
    }
  }, []);

  const deleteOrder = useCallback(async (orderId: string) => {
    try {
      setError(null);
      
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (deleteError) {
        throw deleteError;
      }

      setOrders(prev => prev.filter(order => order.id !== orderId));
    } catch (err) {
      console.error('Failed to delete order from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete order');
      throw err;
    }
  }, []);

  const loadOrder = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  const clearAllOrders = useCallback(async () => {
    try {
      setError(null);
      
      // First, get all order IDs to delete them individually
      const { data: allOrders, error: fetchError } = await supabase
        .from('orders')
        .select('id');

      if (fetchError) {
        throw fetchError;
      }

      if (allOrders && allOrders.length > 0) {
        // Delete all orders by their IDs
        const { error: deleteError } = await supabase
          .from('orders')
          .delete()
          .in('id', allOrders.map(order => order.id));

        if (deleteError) {
          throw deleteError;
        }
      }

      setOrders([]);
    } catch (err) {
      console.error('Failed to clear all orders from Supabase:', err);
      setError(err instanceof Error ? err.message : 'Failed to clear all orders');
      throw err;
    }
  }, []);

  return {
    orders,
    loading,
    error,
    saveOrder,
    deleteOrder,
    loadOrder,
    clearAllOrders,
    refreshOrders: loadOrders
  };
}

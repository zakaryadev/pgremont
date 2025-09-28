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
          services: order.services,
          calculatorType: order.calculator_type || 'polygraphy'
        }));

        setOrders(formattedOrders);
      } catch (err) {
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
    phone?: string,
    calculatorType: 'polygraphy' | 'tablets' | 'letters' = 'polygraphy'
  ) => {
    try {
      setError(null);
      
      const orderData = {
        name,
        phone,
        state,
        results,
        materials,
        services,
        calculator_type: calculatorType
      };

      const { data, error: insertError } = await supabase
        .from('orders')
        .insert([orderData] as any)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      if (!data) {
        throw new Error('No data returned from insert operation');
      }

      const newOrder: Order = {
        id: (data as any).id,
        name: (data as any).name,
        phone: (data as any).phone || undefined,
        createdAt: new Date((data as any).created_at),
        state: (data as any).state,
        results: (data as any).results,
        materials: (data as any).materials,
        services: (data as any).services,
        calculatorType: (data as any).calculator_type || 'polygraphy'
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
          .in('id', allOrders.map((order: any) => order.id));

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

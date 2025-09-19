import { useState, useEffect, useCallback } from 'react';
import { Order, CalculatorState, CalculationResults, Material, Service } from '../types/calculator';

const STORAGE_KEY = 'printpro-orders';

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);

  // Load orders from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedOrders = JSON.parse(stored).map((order: any) => ({
          ...order,
          createdAt: new Date(order.createdAt)
        }));
        setOrders(parsedOrders);
      }
    } catch (error) {
      console.error('Failed to load orders from localStorage:', error);
    }
  }, []);

  // Save orders to localStorage whenever orders change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch (error) {
      console.error('Failed to save orders to localStorage:', error);
    }
  }, [orders]);

  const saveOrder = useCallback((
    name: string,
    state: CalculatorState,
    results: CalculationResults,
    materials: Record<string, Material>,
    services: Record<string, Service>
  ) => {
    const newOrder: Order = {
      id: Date.now().toString(),
      name,
      createdAt: new Date(),
      state,
      results,
      materials,
      services
    };

    setOrders(prev => [newOrder, ...prev]);
    return newOrder;
  }, []);

  const deleteOrder = useCallback((orderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== orderId));
  }, []);

  const loadOrder = useCallback((orderId: string) => {
    return orders.find(order => order.id === orderId);
  }, [orders]);

  const clearAllOrders = useCallback(() => {
    setOrders([]);
  }, []);

  return {
    orders,
    saveOrder,
    deleteOrder,
    loadOrder,
    clearAllOrders
  };
}

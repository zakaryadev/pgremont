import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

export interface PaymentAnalytics {
  totalRevenue: number;
  paymentMethodStats: {
    cash: { amount: number; count: number };
    click: { amount: number; count: number };
    transfer: { amount: number; count: number };
  };
  monthlyStats: Array<{
    month: string;
    totalAmount: number;
    orderCount: number;
    cashAmount: number;
    clickAmount: number;
    transferAmount: number;
  }>;
  dailyStats: Array<{
    date: string;
    totalAmount: number;
    orderCount: number;
  }>;
}

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  paymentMethod?: 'cash' | 'click' | 'transfer';
}

export function usePaymentAnalytics() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (filters: AnalyticsFilters) => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate, paymentMethod } = filters;

      // Build the base query
      let query = supabase
        .from('customer_orders')
        .select(`
          id,
          total_amount,
          advance_payment,
          payment_type,
          created_at,
          payment_records (
            amount,
            payment_method,
            payment_date
          )
        `)
        .gte('created_at', startDate)
        .lte('created_at', endDate);
        

      // Add payment method filter if specified
      if (paymentMethod) {
        query = query.eq('payment_type', paymentMethod);
      }

      const { data: orders, error: ordersError } = await query;

      if (ordersError) {
        throw ordersError;
      }

      if (!orders) {
        setAnalytics({
          totalRevenue: 0,
          paymentMethodStats: {
            cash: { amount: 0, count: 0 },
            click: { amount: 0, count: 0 },
            transfer: { amount: 0, count: 0 }
          },
          monthlyStats: [],
          dailyStats: []
        });
        return;
      }

      // Process the data
      const analyticsData: PaymentAnalytics = {
        totalRevenue: 0,
        paymentMethodStats: {
          cash: { amount: 0, count: 0 },
          click: { amount: 0, count: 0 },
          transfer: { amount: 0, count: 0 }
        },
        monthlyStats: [],
        dailyStats: []
      };

      // Group by month for monthly stats
      const monthlyMap = new Map<string, {
        totalAmount: number;
        orderCount: number;
        cashAmount: number;
        clickAmount: number;
        transferAmount: number;
      }>();

      // Group by day for daily stats
      const dailyMap = new Map<string, {
        totalAmount: number;
        orderCount: number;
      }>();

      orders.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const monthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = orderDate.toISOString().split('T')[0];

        const orderAmount = parseFloat(order.total_amount);
        analyticsData.totalRevenue += orderAmount;

        // Count by payment method
        const paymentMethod = order.payment_type;
        if (paymentMethod === 'cash') {
          analyticsData.paymentMethodStats.cash.amount += orderAmount;
          analyticsData.paymentMethodStats.cash.count += 1;
        } else if (paymentMethod === 'click') {
          analyticsData.paymentMethodStats.click.amount += orderAmount;
          analyticsData.paymentMethodStats.click.count += 1;
        } else if (paymentMethod === 'transfer') {
          analyticsData.paymentMethodStats.transfer.amount += orderAmount;
          analyticsData.paymentMethodStats.transfer.count += 1;
        }

        // Monthly stats
        if (!monthlyMap.has(monthKey)) {
          monthlyMap.set(monthKey, {
            totalAmount: 0,
            orderCount: 0,
            cashAmount: 0,
            clickAmount: 0,
            transferAmount: 0
          });
        }
        const monthData = monthlyMap.get(monthKey)!;
        monthData.totalAmount += orderAmount;
        monthData.orderCount += 1;

        if (paymentMethod === 'cash') {
          monthData.cashAmount += orderAmount;
        } else if (paymentMethod === 'click') {
          monthData.clickAmount += orderAmount;
        } else if (paymentMethod === 'transfer') {
          monthData.transferAmount += orderAmount;
        }

        // Daily stats
        if (!dailyMap.has(dayKey)) {
          dailyMap.set(dayKey, {
            totalAmount: 0,
            orderCount: 0
          });
        }
        const dayData = dailyMap.get(dayKey)!;
        dayData.totalAmount += orderAmount;
        dayData.orderCount += 1;
      });

      // Convert maps to arrays
      analyticsData.monthlyStats = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          ...data
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      analyticsData.dailyStats = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          ...data
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics
  };
}

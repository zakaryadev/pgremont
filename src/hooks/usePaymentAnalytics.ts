import { useState, useCallback, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";

export interface PaymentAnalytics {
  totalRevenue: number;
  totalDebt: number;
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
    cashAmount: number;
    clickAmount: number;
    transferAmount: number;
  }>;
}

export interface AnalyticsFilters {
  startDate: string;
  endDate: string;
  // Removed paymentMethod filter as we now show all payment methods
}

export function usePaymentAnalytics() {
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (filters: AnalyticsFilters) => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = filters;

      // Build the base query
      // startDate va endDate string bo‘lsa (masalan "2025-10-26")
      const start = new Date(startDate);
      const end = new Date(endDate);

      // end sanasini kun oxirigacha kengaytiramiz, shunda o‘sha kun ham kiradi
      end.setHours(23, 59, 59, 999);

      let query = supabase
        .from("customer_orders")
        .select(
          `
    id,
    total_amount,
    advance_payment,
    payment_type,
    created_at,
    payment_records (
      id,
      amount,
      payment_method,
      payment_date,
      payment_type
    )
  `
        )
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order('created_at', { ascending: false });

      const { data: orders, error: ordersError } = await query;

      if (ordersError) {
        throw ordersError;
      }

      if (!orders) {
        setAnalytics({
          totalRevenue: 0,
          totalDebt: 0,
          paymentMethodStats: {
            cash: { amount: 0, count: 0 },
            click: { amount: 0, count: 0 },
            transfer: { amount: 0, count: 0 },
          },
          monthlyStats: [],
          dailyStats: [],
        });
        return;
      }

      // Process the data
      const analyticsData: PaymentAnalytics = {
        totalRevenue: 0,
        totalDebt: 0,
        paymentMethodStats: {
          cash: { amount: 0, count: 0 },
          click: { amount: 0, count: 0 },
          transfer: { amount: 0, count: 0 },
        },
        monthlyStats: [],
        dailyStats: [],
      };

      // Calculate total debt from all orders
      interface CustomerOrder {
        id: string;
        total_amount: string;
        advance_payment: string;
        payment_records: Array<{
          amount: string;
          payment_type: string;
        }>;
      }

      const { data: allOrders, error: allOrdersError } = await supabase
        .from('customer_orders')
        .select('id, total_amount, advance_payment, payment_records(amount, payment_type)');

      if (allOrders) {
        (allOrders as unknown as CustomerOrder[]).forEach(order => {
          const totalAmount = parseFloat(order.total_amount);
          const advancePayment = parseFloat(order.advance_payment) || 0;
          
          // Calculate total payments (excluding advance payment)
          const payments = (order.payment_records || []).reduce((sum, record) => {
            return record.payment_type === 'payment' ? sum + parseFloat(record.amount) : sum;
          }, 0);
          
          const remainingBalance = Math.max(0, totalAmount - advancePayment - payments);
          analyticsData.totalDebt += remainingBalance;
        });
      }

      // Group by month for monthly stats
      const monthlyMap = new Map<
        string,
        {
          totalAmount: number;
          orderCount: number;
          cashAmount: number;
          clickAmount: number;
          transferAmount: number;
        }
      >();

      // Group by day for daily stats
      const dailyMap = new Map<
        string,
        {
          totalAmount: number;
          orderCount: number;
          cashAmount: number;
          clickAmount: number;
          transferAmount: number;
        }
      >();

      orders.forEach((order: any) => {
        const orderDate = new Date(order.created_at);
        const monthKey = `${orderDate.getFullYear()}-${String(
          orderDate.getMonth() + 1
        ).padStart(2, "0")}`;
        const dayKey = orderDate.toISOString().split("T")[0];

        const orderAmount = parseFloat(order.total_amount);
        analyticsData.totalRevenue += orderAmount;

        // Track payment methods from payment records
        const paymentRecords = order.payment_records || [];
        const hasPaymentRecords = paymentRecords.length > 0;

        // If there are payment records, use them to track payment methods
        if (hasPaymentRecords) {
          paymentRecords.forEach((record: any) => {
            const amount = parseFloat(record.amount);
            const paymentMethod = record.payment_method || order.payment_type;
            
            // Update payment method stats
            if (paymentMethod === "cash") {
              analyticsData.paymentMethodStats.cash.amount += amount;
              analyticsData.paymentMethodStats.cash.count += 1;
            } else if (paymentMethod === "click") {
              analyticsData.paymentMethodStats.click.amount += amount;
              analyticsData.paymentMethodStats.click.count += 1;
            } else if (paymentMethod === "transfer") {
              analyticsData.paymentMethodStats.transfer.amount += amount;
              analyticsData.paymentMethodStats.transfer.count += 1;
            }

            // Initialize month data if not exists
            if (!monthlyMap.has(monthKey)) {
              monthlyMap.set(monthKey, {
                totalAmount: 0,
                orderCount: 0,
                cashAmount: 0,
                clickAmount: 0,
                transferAmount: 0,
              });
            }
            const monthData = monthlyMap.get(monthKey)!;
            
            // Update month data
            monthData.totalAmount += amount;
            if (record.payment_type === 'advance') {
              monthData.orderCount += 1; // Only count order once for advance payment
            }

            if (paymentMethod === "cash") {
              monthData.cashAmount += amount;
            } else if (paymentMethod === "click") {
              monthData.clickAmount += amount;
            } else if (paymentMethod === "transfer") {
              monthData.transferAmount += amount;
            }

            // Initialize day data if not exists
            if (!dailyMap.has(dayKey)) {
              dailyMap.set(dayKey, {
                totalAmount: 0,
                orderCount: 0,
                cashAmount: 0,
                clickAmount: 0,
                transferAmount: 0,
              });
            }
            const dayData = dailyMap.get(dayKey)!;
            
            // Update day data
            dayData.totalAmount += amount;
            if (record.payment_type === 'advance') {
              dayData.orderCount += 1; // Only count order once for advance payment
            }

            if (paymentMethod === 'cash') {
              dayData.cashAmount += amount;
            } else if (paymentMethod === 'click') {
              dayData.clickAmount += amount;
            } else if (paymentMethod === 'transfer') {
              dayData.transferAmount += amount;
            }
          });
        } else {
          // Fallback to using order's payment type if no payment records exist
          const paymentMethod = order.payment_type;
          
          // Update payment method stats
          if (paymentMethod === "cash") {
            analyticsData.paymentMethodStats.cash.amount += orderAmount;
            analyticsData.paymentMethodStats.cash.count += 1;
          } else if (paymentMethod === "click") {
            analyticsData.paymentMethodStats.click.amount += orderAmount;
            analyticsData.paymentMethodStats.click.count += 1;
          } else if (paymentMethod === "transfer") {
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
              transferAmount: 0,
            });
          }
          const monthData = monthlyMap.get(monthKey)!;
          monthData.totalAmount += orderAmount;
          monthData.orderCount += 1;

          if (paymentMethod === "cash") {
            monthData.cashAmount += orderAmount;
          } else if (paymentMethod === "click") {
            monthData.clickAmount += orderAmount;
          } else if (paymentMethod === "transfer") {
            monthData.transferAmount += orderAmount;
          }

          // Daily stats
          if (!dailyMap.has(dayKey)) {
            dailyMap.set(dayKey, {
              totalAmount: 0,
              orderCount: 0,
              cashAmount: 0,
              clickAmount: 0,
              transferAmount: 0,
            });
          }
          const dayData = dailyMap.get(dayKey)!;
          dayData.totalAmount += orderAmount;
          dayData.orderCount += 1;
          
          if (paymentMethod === 'cash') {
            dayData.cashAmount += orderAmount;
          } else if (paymentMethod === 'click') {
            dayData.clickAmount += orderAmount;
          } else if (paymentMethod === 'transfer') {
            dayData.transferAmount += orderAmount;
          }
        }
      });

      // Convert maps to arrays
      analyticsData.monthlyStats = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month));

      analyticsData.dailyStats = Array.from(dailyMap.entries())
        .map(([date, data]) => ({
          date,
          ...data,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Failed to fetch analytics:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch analytics"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    analytics,
    loading,
    error,
    fetchAnalytics,
  };
}


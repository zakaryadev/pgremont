import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DailyExpense {
  id: string;
  name: string;
  amount: number;
  cash: number;
  click: number;
  transfer: number;
  createdAt: string;
  updatedAt: string;
}

export function useDailyExpenses() {
  const [items, setItems] = useState<DailyExpense[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await (supabase as any)
        .from('daily_expenses')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      const rows: any[] = data || [];
      const mapped: DailyExpense[] = rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        amount: Number(r.amount),
        cash: Number(r.cash),
        click: Number(r.click),
        transfer: Number(r.transfer),
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));
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

  const add = useCallback(async (payload: Omit<DailyExpense, 'id' | 'createdAt' | 'updatedAt'>) => {
    const insertBody: any = {
      user_id: null, // Custom auth doesn't use Supabase auth, so user_id is null
      name: payload.name,
      amount: payload.amount,
      cash: payload.cash,
      click: payload.click,
      transfer: payload.transfer,
    };
    const { data, error } = await (supabase as any)
      .from('daily_expenses')
      .insert([insertBody])
      .select()
      .single();
    if (error) throw error;
    const row: any = data;
    const mapped: DailyExpense = {
      id: row.id,
      name: row.name,
      amount: Number(row.amount),
      cash: Number(row.cash),
      click: Number(row.click),
      transfer: Number(row.transfer),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    setItems((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const update = useCallback(async (id: string, payload: Partial<Omit<DailyExpense, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const updateBody: any = {
      name: payload.name,
      amount: payload.amount,
      cash: payload.cash,
      click: payload.click,
      transfer: payload.transfer,
    };
    const { data, error } = await (supabase as any)
      .from('daily_expenses')
      .update(updateBody)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    const row: any = data;
    const mapped: DailyExpense = {
      id: row.id,
      name: row.name,
      amount: Number(row.amount),
      cash: Number(row.cash),
      click: Number(row.click),
      transfer: Number(row.transfer),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
    setItems((prev) => prev.map((x) => (x.id === id ? mapped : x)));
    return mapped;
  }, []);

  const remove = useCallback(async (id: string) => {
    const { error } = await (supabase as any)
      .from('daily_expenses')
      .delete()
      .eq('id', id);
    if (error) throw error;
    setItems((prev) => prev.filter((x) => x.id !== id));
  }, []);

  return { items, loading, error, load, add, update, remove };
}



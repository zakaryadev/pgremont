import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePaymentRecords } from '@/hooks/usePaymentRecords';

interface PendingPaymentItem {
  id: string;
  orderId: string;
  customerName?: string;
  amount: number;
  paymentType: 'advance' | 'payment';
  paymentMethod: 'cash' | 'click' | 'transfer';
  description?: string;
  paymentDate: string;
  createdAt: string;
}

export function PendingPayments() {
  const [items, setItems] = useState<PendingPaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { updatePaymentRecordStatus, loading: statusLoading } = usePaymentRecords();

  const load = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          id,
          order_id,
          amount,
          payment_type,
          payment_method,
          description,
          payment_date,
          created_at,
          status,
          customer_orders ( customer_name )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      if (error) throw error;

      const mapped: PendingPaymentItem[] = (data || []).map((r: any) => ({
        id: r.id,
        orderId: r.order_id,
        customerName: r.customer_orders?.customer_name,
        amount: parseFloat(r.amount),
        paymentType: r.payment_type,
        paymentMethod: r.payment_method,
        description: r.description || undefined,
        paymentDate: r.payment_date,
        createdAt: r.created_at,
      }));
      setItems(mapped);
    } catch (err) {
      console.error('Failed to load pending payments', err);
      toast({ title: 'Xatolik', description: "Kutilayotgan to'lovlarni yuklashda xatolik", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    try {
      await updatePaymentRecordStatus(id, action);
      toast({
        title: action === 'approved' ? 'Tasdiqlandi' : 'Rad etildi',
        description: action === 'approved' ? "To'lov tasdiqlandi" : "To'lov rad etildi",
      });
      await load();
    } catch (err) {
      toast({ title: 'Xatolik', description: 'Amal bajarilmadi', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kutilayotgan to'lovlar</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-sm text-muted-foreground">Yuklanmoqda...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-muted-foreground">Kutilayotgan to'lovlar yo'q</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="p-3 border rounded-lg flex items-center justify-between">
                <div className="flex flex-col">
                  <div className="font-medium">
                    {item.customerName || 'Mijoz'} — {new Intl.NumberFormat('uz-UZ').format(item.amount)} so'm
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.paymentDate).toLocaleDateString('uz-UZ')} • {item.description || '-'}
                  </div>
                  <div className="flex gap-2 mt-1">
                    <Badge className={item.paymentType === 'advance' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                      {item.paymentType === 'advance' ? 'Avans' : "To'lov"}
                    </Badge>
                    <Badge className={item.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : item.paymentMethod === 'click' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}>
                      {item.paymentMethod === 'cash' ? 'NAQD' : item.paymentMethod === 'click' ? 'CLICK' : 'PERECHESLENIYA'}
                    </Badge>
                    <Badge className="bg-yellow-100 text-yellow-800">Kutilmoqda</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={statusLoading} onClick={() => handleAction(item.id, 'rejected')}>Rad etish</Button>
                  <Button disabled={statusLoading} onClick={() => handleAction(item.id, 'approved')}>Tasdiqlash</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

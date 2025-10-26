import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Save, X, Plus, Minus } from 'lucide-react';
import { CustomerOrder } from '@/hooks/useCustomerOrders';
import { useToast } from '@/hooks/use-toast';
import { usePaymentRecords } from '@/hooks/usePaymentRecords';

interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  type: 'advance' | 'payment';
  description: string;
  paymentType?: 'cash' | 'click' | 'transfer';
}

interface PaymentRecordModalProps {
  order: CustomerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (orderId: string, paymentRecords: PaymentRecord[]) => Promise<void>;
}

export function PaymentRecordModal({ order, isOpen, onClose, onSave }: PaymentRecordModalProps) {
  const { toast } = useToast();
  const { savePaymentRecords, getPaymentRecords, deletePaymentRecord, loading } = usePaymentRecords();
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    type: 'payment' as 'advance' | 'payment',
    description: '',
    paymentType: 'cash' as 'cash' | 'click' | 'transfer'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (order && isOpen) {
      loadPaymentHistory();
    }
  }, [order, isOpen]);

  // Refresh order data when modal opens to ensure we have the latest data
  useEffect(() => {
    if (order && isOpen) {
      // Force a small delay to ensure the order data is fresh
      const timeoutId = setTimeout(() => {
        loadPaymentHistory();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [isOpen]);

  const loadPaymentHistory = async () => {
    if (!order) return;

    try {
      setLoadingHistory(true);
      const existingRecords = await getPaymentRecords(order.id);
      
      // Convert database records to modal format
      const modalRecords: PaymentRecord[] = existingRecords.map(record => ({
        id: record.id,
        amount: record.amount,
        date: record.paymentDate,
        type: record.paymentType,
        description: record.description,
        paymentType: record.paymentMethod || 'cash' // Default to cash if not specified
      }));

      // Check if advance payment record already exists in database
      const hasAdvanceRecord = modalRecords.some(record => record.type === 'advance');
      
      // If no existing records and there's an advance payment, add the initial advance payment
      if (modalRecords.length === 0 && order.advancePayment > 0) {
        const existingAdvance: PaymentRecord = {
          id: 'existing-advance',
          amount: order.advancePayment,
          date: order.createdAt.toISOString().split('T')[0],
          type: 'advance',
          description: 'Dastlabki avans to\'lovi',
          paymentType: order.paymentType
        };
        setPaymentRecords([existingAdvance]);
      } else if (!hasAdvanceRecord && order.advancePayment > 0) {
        // If there are other records but no advance record, add it
        const existingAdvance: PaymentRecord = {
          id: 'existing-advance',
          amount: order.advancePayment,
          date: order.createdAt.toISOString().split('T')[0],
          type: 'advance',
          description: 'Dastlabki avans to\'lovi',
          paymentType: order.paymentType
        };
        setPaymentRecords([existingAdvance, ...modalRecords]);
      } else {
        setPaymentRecords(modalRecords);
      }
    } catch (error) {
      console.error('Failed to load payment history:', error);
      // Fallback to showing just the advance payment
      if (order.advancePayment > 0) {
        const existingAdvance: PaymentRecord = {
          id: 'existing-advance',
          amount: order.advancePayment,
          date: order.createdAt.toISOString().split('T')[0],
          type: 'advance',
          description: 'Dastlabki avans to\'lovi',
          paymentType: order.paymentType
        };
        setPaymentRecords([existingAdvance]);
      } else {
        setPaymentRecords([]);
      }
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddPayment = () => {
    if (!newPayment.amount || parseFloat(newPayment.amount) <= 0) {
      toast({
        title: "Xatolik",
        description: "To'lov summasini kiriting",
        variant: "destructive"
      });
      return;
    }

    const payment: PaymentRecord = {
      id: `temp-${Date.now()}`, // Temporary ID for new payments
      amount: parseFloat(newPayment.amount),
      date: new Date().toISOString().split('T')[0],
      type: newPayment.type,
      description: newPayment.description || `${newPayment.type === 'advance' ? 'Avans' : 'To\'lov'} - ${new Date().toLocaleDateString('uz-UZ')}`,
      paymentType: newPayment.paymentType
    };

    setPaymentRecords(prev => [...prev, payment]);
    setNewPayment({ amount: '', type: 'payment', description: '', paymentType: 'cash' });
  };

  const handleRemovePayment = async (id: string) => {
    // Don't allow removing the existing advance payment
    if (id === 'existing-advance') {
      toast({
        title: "Xatolik",
        description: "Dastlabki avans to'lovini o'chirib bo'lmaydi",
        variant: "destructive"
      });
      return;
    }

    try {
      // If it's a database record, delete from database
      if (id !== 'existing-advance' && !id.startsWith('temp-')) {
        await deletePaymentRecord(id);
        toast({
          title: "O'chirildi",
          description: "To'lov qaydnomasi o'chirildi",
        });
      }

      // Remove from local state
      setPaymentRecords(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "To'lov qaydnomasini o'chirishda xatolik yuz berdi",
        variant: "destructive"
      });
    }
  };

  const calculateTotals = () => {
    const totalPaid = paymentRecords.reduce((sum, payment) => sum + payment.amount, 0);
    const remaining = (order?.totalAmount || 0) - totalPaid;
    return { totalPaid, remaining };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const handleSave = async () => {
    if (!order) return;

    // Validate order ID
    if (!order.id || order.id.trim() === '') {
      toast({
        title: "Xatolik",
        description: "Buyurtma ma'lumotlari noto'g'ri. Sahifani yangilang va qayta urining.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Only save new payments (those with temp IDs)
      const newPayments = paymentRecords.filter(record => record.id.startsWith('temp-'));
      
      if (newPayments.length > 0) {
        const recordsToSave = newPayments.map(record => ({
          amount: record.amount,
          paymentType: record.type,
          description: record.description,
          paymentDate: record.date,
          paymentMethod: record.paymentType || 'cash'
        }));

        await savePaymentRecords(order.id, recordsToSave);
      } else {
        toast({
          title: "Ogohlantirish",
          description: "Saqlash uchun yangi to'lov qo'shing",
        });
        return;
      }
      
      toast({
        title: "Muvaffaqiyatli saqlandi",
        description: "To'lov qaydnomasi saqlandi",
      });
      onClose();
    } catch (error) {
      console.error('Failed to save payment records:', error);
      
      let errorMessage = "To'lov qaydnomasini saqlashda xatolik yuz berdi";
      
      if (error instanceof Error) {
        if (error.message.includes('does not exist')) {
          errorMessage = "Buyurtma topilmadi. Sahifani yangilang va qayta urining.";
        } else if (error.message.includes('foreign key constraint')) {
          errorMessage = "Buyurtma ma'lumotlari noto'g'ri. Sahifani yangilang va qayta urining.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Xatolik",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

  const { totalPaid, remaining } = calculateTotals();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>To'lov qaydnomasi</DialogTitle>
          <DialogDescription>
            {order.customerName} - Jami: {formatCurrency(order.totalAmount)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Order Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Buyurtma ma'lumotlari</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Mijoz</Label>
                  <p className="text-sm">{order.customerName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Jami summa</Label>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(order.totalAmount)}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">To'lov turi</Label>
                  <Badge className="bg-blue-100 text-blue-800">
                    {order.paymentType === 'cash' ? 'NAQD' : 
                     order.paymentType === 'click' ? 'CLICK' : 'PERECHESLENIYA'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">To'lov hisoboti</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <Label className="text-sm font-medium">To'langan</Label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(totalPaid)}
                  </p>
                </div>
                <div className="text-center">
                  <Label className="text-sm font-medium">Qolgan</Label>
                  <p className={`text-lg font-semibold ${remaining > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(remaining)}
                  </p>
                </div>
                <div className="text-center">
                  <Label className="text-sm font-medium">Holat</Label>
                  <Badge className={remaining <= 0 ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                    {remaining <= 0 ? 'To\'liq to\'langan' : 'Qism to\'langan'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add New Payment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Yangi to'lov qo'shish</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div>
                  <Label htmlFor="payment-amount">Summa</Label>
                  <Input
                    id="payment-amount"
                    type="number"
                    value={newPayment.amount}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="To'lov summa"
                  />
                </div>
                <div>
                  <Label htmlFor="payment-type">To'lov turi</Label>
                  <Select value={newPayment.type} onValueChange={(value: 'advance' | 'payment') => 
                    setNewPayment(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="advance">Avans</SelectItem>
                      <SelectItem value="payment">To'lov</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-method">To'lov usuli</Label>
                  <Select value={newPayment.paymentType} onValueChange={(value: 'cash' | 'click' | 'transfer') => 
                    setNewPayment(prev => ({ ...prev, paymentType: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">NAQD</SelectItem>
                      <SelectItem value="click">CLICK</SelectItem>
                      <SelectItem value="transfer">PERECHESLENIYA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="payment-description">Tavsif</Label>
                  <Input
                    id="payment-description"
                    value={newPayment.description}
                    onChange={(e) => setNewPayment(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="To'lov tavsifi"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddPayment} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Qo'shish
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">To'lov tarixi</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">To'lov tarixi yuklanmoqda...</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paymentRecords.map((payment, index) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-muted-foreground">{payment.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(payment.date).toLocaleDateString('uz-UZ')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col gap-1">
                        <Badge className={
                          payment.type === 'advance' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }>
                          {payment.type === 'advance' ? 'Avans' : 'To\'lov'}
                        </Badge>
                        <Badge className={
                          payment.paymentType === 'cash' 
                            ? 'bg-green-100 text-green-800'
                            : payment.paymentType === 'click'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }>
                          {payment.paymentType === 'cash' ? 'NAQD' : 
                           payment.paymentType === 'click' ? 'CLICK' : 'PERECHESLENIYA'}
                        </Badge>
                      </div>
                      {payment.id !== 'existing-advance' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePayment(payment.id)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Bekor qilish
            </Button>
            
            <Button
              onClick={handleSave}
              disabled={isLoading || loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading || loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

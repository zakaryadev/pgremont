import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Save, X } from 'lucide-react';
import { CustomerOrder } from '@/hooks/useCustomerOrders';
import { useToast } from '@/hooks/use-toast';

interface EditCustomerOrderModalProps {
  order: CustomerOrder | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: Partial<CustomerOrder>) => Promise<void>;
}

export function EditCustomerOrderModal({ order, isOpen, onClose, onSave }: EditCustomerOrderModalProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    customerName: '',
    phoneNumber: '',
    totalAmount: '',
    paymentType: '',
    advancePayment: '',
    remainingBalance: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setFormData({
        customerName: order.customerName,
        phoneNumber: order.phoneNumber || '',
        totalAmount: order.totalAmount.toString(),
        paymentType: order.paymentType,
        advancePayment: order.advancePayment.toString(),
        remainingBalance: order.remainingBalance.toString()
      });
    }
  }, [order]);

  const handleInputChange = (field: string, value: string) => {
    const newFormData = {
      ...formData,
      [field]: value
    };

    // Auto-calculate remaining balance when advance payment or total amount changes
    if (field === 'advancePayment' || field === 'totalAmount') {
      const total = parseFloat(field === 'totalAmount' ? value : newFormData.totalAmount) || 0;
      const advance = parseFloat(field === 'advancePayment' ? value : newFormData.advancePayment) || 0;
      const remaining = total - advance;
      
      newFormData.remainingBalance = remaining >= 0 ? remaining.toFixed(0) : '0';
    }

    setFormData(newFormData);
  };

  const handleSave = async () => {
    // Validation
    if (!formData.customerName.trim()) {
      toast({
        title: "Xatolik",
        description: "Mijoz nomini kiriting",
        variant: "destructive"
      });
      return;
    }

    if (!formData.totalAmount.trim()) {
      toast({
        title: "Xatolik",
        description: "Umumiy summani kiriting",
        variant: "destructive"
      });
      return;
    }

    if (!formData.paymentType.trim()) {
      toast({
        title: "Xatolik",
        description: "To'lov turini tanlang",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      const updatedOrder = {
        customerName: formData.customerName,
        phoneNumber: formData.phoneNumber || undefined,
        totalAmount: parseFloat(formData.totalAmount),
        paymentType: formData.paymentType as 'cash' | 'click' | 'transfer',
        advancePayment: parseFloat(formData.advancePayment) || 0,
        remainingBalance: parseFloat(formData.remainingBalance) || 0
      };

      await onSave(updatedOrder);
      
      toast({
        title: "Muvaffaqiyatli yangilandi",
        description: `${formData.customerName} uchun ma'lumotlar yangilandi`,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yangilashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mijoz buyurtmasini tahrirlash</DialogTitle>
          <DialogDescription>
            {order.customerName} uchun ma'lumotlarni yangilang
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Mijoz ma'lumotlari</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-customerName">MIJOZ NOMI</Label>
                <Input
                  id="edit-customerName"
                  value={formData.customerName}
                  onChange={(e) => handleInputChange('customerName', e.target.value)}
                  placeholder="Mijoz ismini kiriting"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phoneNumber">TELEFON RAQAMI</Label>
                <Input
                  id="edit-phoneNumber"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="+998 XX XXX XX XX"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">To'lov ma'lumotlari</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-totalAmount">UMUMIY SUMMASI</Label>
                <Input
                  id="edit-totalAmount"
                  type="number"
                  value={formData.totalAmount}
                  onChange={(e) => handleInputChange('totalAmount', e.target.value)}
                  placeholder="Jami summa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-paymentType">TO'LOV TURI</Label>
                <Select value={formData.paymentType} onValueChange={(value) => handleInputChange('paymentType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="To'lov turini tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">NAQD</SelectItem>
                    <SelectItem value="click">CLICK</SelectItem>
                    <SelectItem value="transfer">PERECHESLENIYA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-advancePayment">AVANS</Label>
                <Input
                  id="edit-advancePayment"
                  type="number"
                  value={formData.advancePayment}
                  onChange={(e) => handleInputChange('advancePayment', e.target.value)}
                  placeholder="Avans summa"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-remainingBalance">QOLDIQ</Label>
                <Input
                  id="edit-remainingBalance"
                  type="number"
                  value={formData.remainingBalance}
                  readOnly
                  className="bg-muted"
                  placeholder="Qolgan summa"
                />
              </div>
            </div>
          </div>

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
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isLoading ? 'Yangilanmoqda...' : 'Saqlash'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

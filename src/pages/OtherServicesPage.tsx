import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Save, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCustomerOrders } from '@/hooks/useCustomerOrders';
import { CustomerOrdersTable } from '@/components/calculator/CustomerOrdersTable';
import { NumericFormat } from 'react-number-format';
import { DailyExpensesTable } from '@/components/expenses/DailyExpensesTable';

interface CustomerFormData {
  customerName: string;
  phoneNumber: string;
  totalAmount: string;
  paymentType: string;
  advancePayment: string;
  remainingBalance: string;
}

const OtherServicesPage = () => {
  const navigate = useNavigate();
  const location = useLocation() as { state?: { showDebtors?: boolean; partialOnly?: boolean } };
  const searchParams = new URLSearchParams((useLocation() as any).search || '');
  const queryDebt = searchParams.get('debt');
  const wantPartialDebtors = location.state?.partialOnly === true || queryDebt === 'partial';
  const wantDebtors = location.state?.showDebtors === true || queryDebt === 'partial' || queryDebt === 'all';
  const { toast } = useToast();
  const { saveOrder } = useCustomerOrders();
  const [activeMenu, setActiveMenu] = useState<number>(() => {
    if (queryDebt === 'partial' || queryDebt === 'all') return 2; // Bizning Qarzlar (force from query)
    try {
      const stored = localStorage.getItem('otherServicesActiveTab');
      if (stored !== null) return Number(stored);
    } catch {}
    return 0; // Bosh sahifa (default)
  });
  const menuItems = ['Bosh sahifa', 'Kunlik rasxodlar', 'Bizning Qarzlar'];
  const [formData, setFormData] = useState<CustomerFormData>({
    customerName: '',
    phoneNumber: '',
    totalAmount: '',
    paymentType: '',
    advancePayment: '0', // Always 0 for new orders
    remainingBalance: '0' // Always 0 for new orders
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleInputChange = (field: keyof CustomerFormData, value: string) => {
    // For numeric fields, remove all non-digit characters before saving
    const numericFields: (keyof CustomerFormData)[] = ['totalAmount', 'advancePayment', 'remainingBalance'];
    const processedValue = numericFields.includes(field) 
      ? value.replace(/\D/g, '') 
      : value;

    const newFormData = {
      ...formData,
      [field]: processedValue
    };

    // Calculate remaining balance when total amount or advance payment changes
    if (field === 'totalAmount' || field === 'advancePayment') {
      const totalAmount = parseInt(field === 'totalAmount' ? processedValue : newFormData.totalAmount) || 0;
      const advancePayment = parseInt(field === 'advancePayment' ? processedValue : newFormData.advancePayment) || 0;
      const remainingBalance = Math.max(0, totalAmount - advancePayment);
      
      newFormData.remainingBalance = remainingBalance.toString();
    }

    setFormData(newFormData);
  };

  // Format number with thousand separators
  const formatNumber = (value: string) => {
    return value ? parseInt(value).toLocaleString('en-US') : '';
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

    if (!formData.phoneNumber.trim()) {
      toast({
        title: "Xatolik", 
        description: "Telefon raqamini kiriting",
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

    // Validate advance payment
    const totalAmount = parseFloat(formData.totalAmount);
    const advancePayment = parseFloat(formData.advancePayment) || 0;
    
    if (advancePayment < 0) {
      toast({
        title: "Xatolik",
        description: "Avans to'lov manfiy bo'lishi mumkin emas",
        variant: "destructive"
      });
      return;
    }

    if (advancePayment > totalAmount) {
      toast({
        title: "Xatolik",
        description: "Avans to'lov umumiy summadan ko'p bo'lishi mumkin emas",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Save to database
      await saveOrder(
        formData.customerName,
        formData.phoneNumber,
        parseFloat(formData.totalAmount),
        formData.paymentType as 'cash' | 'click' | 'transfer',
        parseFloat(formData.advancePayment) || 0,
        parseFloat(formData.remainingBalance) || 0
      );
      
      toast({
        title: "Muvaffaqiyatli saqlandi",
        description: `${formData.customerName} uchun ma'lumotlar saqlandi`,
      });

      // Reset form
      setFormData({
        customerName: '',
        phoneNumber: '',
        totalAmount: '',
        paymentType: '',
        advancePayment: '0',
        remainingBalance: '0'
      });

    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni saqlashda xatolik yuz berdi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    // Search functionality is now handled in CustomerOrdersTable component
    toast({
      title: "Qidiruv",
      description: "Qidiruv funksiyasi jadvalda mavjud",
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Orqaga
            </Button>
            <h1 className="text-2xl font-bold">Boshqa xizmatlar</h1>
          </div>

          {/* Topbar Menus as Tabs */}
          <div className="mb-6">
            <div className="flex items-center gap-2 border-b">
              {menuItems.map((item, idx) => {
                const isActive = activeMenu === idx;
                return (
                  <button
                    key={item}
                    onClick={() => {
                      setActiveMenu(idx);
                      try { localStorage.setItem('otherServicesActiveTab', String(idx)); } catch {}
                    }}
                    className={`relative -mb-px px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary border-b-2 border-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {item}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main content */}
          <div>
              {activeMenu === 0 && (
                <div className="mb-4 flex justify-end">
                  <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                      <Button className="flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        Yangi buyurtma
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Mijoz ma'lumotlari va buyurtma boshqaruvi</DialogTitle>
                        <DialogDescription>Yangi buyurtma ma'lumotlarini kiriting</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                        {/* Customer Information */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-semibold">Mijoz ma'lumotlari</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="customerName">MIJOZ NOMI</Label>
                              <Input
                                id="customerName"
                                value={formData.customerName}
                                onChange={(e) => handleInputChange('customerName', e.target.value)}
                                placeholder="Mijoz ismini kiriting"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="phoneNumber">TELEFON RAQAMI</Label>
                              <Input
                                id="phoneNumber"
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
                              <Label htmlFor="totalAmount">UMUMIY SUMMASI</Label>
                              <NumericFormat
                                id="totalAmount"
                                value={formData.totalAmount}
                                onValueChange={(values) => handleInputChange('totalAmount', values.value)}
                                thousandSeparator=" "
                                allowNegative={false}
                                customInput={Input}
                                placeholder="Umumiy summani kiriting"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="paymentType">TO'LOV TURI</Label>
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
                              <Label htmlFor="advancePayment">AVANS TO'LOV</Label>
                              <NumericFormat
                                id="advancePayment"
                                value={formData.advancePayment}
                                onValueChange={(values) => handleInputChange('advancePayment', values.value)}
                                thousandSeparator=" "
                                allowNegative={false}
                                customInput={Input}
                                placeholder="Avans to'lov miqdorini kiriting"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="remainingBalance">QOLDIQ</Label>
                              <NumericFormat
                                id="remainingBalance"
                                value={formData.remainingBalance}
                                thousandSeparator=" "
                                customInput={Input}
                                readOnly
                                className={`font-medium ${
                                  parseInt(formData.remainingBalance) === 0 
                                    ? 'bg-green-50 text-green-700' 
                                    : 'bg-yellow-50 text-yellow-700'
                                }`}
                                placeholder="Qolgan summa"
                              />
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4">
                          <Button
                            onClick={async () => {
                              await handleSave();
                              setIsFormOpen(false);
                            }}
                            disabled={isLoading}
                            className="flex items-center gap-2"
                          >
                            <Save className="h-4 w-4" />
                            {isLoading ? 'Saqlanmoqda...' : 'SAVE'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              {/* Tab Content */}
              <div className="mt-6">
                {activeMenu === 0 && (
                  <CustomerOrdersTable
                    initialPaymentStatus={wantDebtors ? 'unpaid' : 'all'}
                    initialShowFilters={wantDebtors}
                    initialPartialOnly={wantPartialDebtors}
                    disableDefaultMonthRange={wantDebtors}
                  />
                )}
                {activeMenu === 1 && (
                  <DailyExpensesTable />
                )}
                {activeMenu === 2 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Bizning Qarzlar (Kunlik rasxodlardan)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DailyExpensesTable onlyWithDebt hideCreate />
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );
};

export default OtherServicesPage;

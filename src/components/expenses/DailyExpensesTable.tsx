import React, { useMemo, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { NumericFormat } from 'react-number-format';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search, Calendar, History } from 'lucide-react';
import { useDailyExpenses, DailyExpense } from '@/hooks/useDailyExpenses';
import { useExpensePaymentRecords } from '@/hooks/useExpensePaymentRecords';
import { supabase } from '@/integrations/supabase/client';

interface DailyExpensesTableProps {
  onlyWithDebt?: boolean;
  hideCreate?: boolean;
}

const formatCurrency = (value: number) => {
  return value.toLocaleString('en-US');
};

const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat('uz-UZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
};

const getPaymentTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    cash: 'NAQD',
    click: 'CLICK',
    transfer: 'PERECHESLENIYE',
  };
  return labels[type] || type;
};

const getPaymentTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    cash: 'bg-green-100 text-green-800',
    click: 'bg-blue-100 text-blue-800',
    transfer: 'bg-purple-100 text-purple-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
};

export const DailyExpensesTable: React.FC<DailyExpensesTableProps> = ({ onlyWithDebt = false, hideCreate = false }) => {
  const { toast } = useToast();
  const { items, add, update, remove, loading, load } = useDailyExpenses();
  const { getPaymentRecords, savePaymentRecords, deletePaymentRecord } = useExpensePaymentRecords();
  const [query, setQuery] = useState('');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<'all' | 'cash' | 'click' | 'transfer'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id?: string;
    name: string;
    description?: string;
    totalAmount: string;
    paymentType: 'cash' | 'click' | 'transfer';
    advancePayment: string;
  } | null>(null);
  const [selectedExpense, setSelectedExpense] = useState<DailyExpense | null>(null);
  const [paymentRecords, setPaymentRecords] = useState<any[]>([]);
  const [newPayment, setNewPayment] = useState({
    amount: '',
    description: '',
    paymentType: 'cash' as 'cash' | 'click' | 'transfer',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  const quickExpenseNames = [
    'Ibrohim',
    'Yandex',
    'Akril Fomaks',
    'Banner Orakal',
    'Konstovar',
    'Oybek aka',
    'Yi long',
    'Tornado',
    'Adxam aka',
    'Alyukabond',
    'west like',
    'fresh Print',
  ];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = items;
    if (onlyWithDebt) {
      base = base.filter((it) => it.remainingBalance > 0);
    }
    let res = base;
    if (q) {
      res = res.filter((it) => it.name.toLowerCase().includes(q));
    }

    // payment type filter
    if (paymentTypeFilter !== 'all') {
      res = res.filter((it) => it.paymentType === paymentTypeFilter);
    }

    // date range filter
    if (startDate || endDate) {
      const from = startDate ? new Date(startDate) : null;
      const to = endDate ? new Date(endDate) : null;
      res = res.filter((it) => {
        const d = it.createdAt;
        const afterFrom = !from || d >= new Date(from.getFullYear(), from.getMonth(), from.getDate());
        const beforeTo = !to || d <= new Date(to.getFullYear(), to.getMonth(), to.getDate(), 23, 59, 59, 999);
        return afterFrom && beforeTo;
      });
    }

    return res;
  }, [items, query, onlyWithDebt, paymentTypeFilter, startDate, endDate]);

  const startCreate = () => {
    setEditing({
      name: '',
      description: '',
      totalAmount: '',
      paymentType: 'cash',
      advancePayment: '',
    });
    setIsDialogOpen(true);
  };

  const startEdit = (row: DailyExpense) => {
    setEditing({
      id: row.id,
      name: row.name,
      description: (row as any).description || '',
      totalAmount: row.totalAmount.toString(),
      paymentType: row.paymentType,
      advancePayment: row.advancePayment.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await remove(id);
      toast({ title: 'Oʻchirildi', description: 'Rasxod o‘chirildi' });
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e?.message || 'O‘chirishda xatolik', variant: 'destructive' });
    }
  };

  const save = async () => {
    if (!editing) return;
    const { name, description, totalAmount, paymentType, advancePayment } = editing;
    
    if (!name.trim()) {
      toast({ title: 'Xatolik', description: "Rasxod nomi kerak", variant: 'destructive' });
      return;
    }
    
    const total = parseFloat(totalAmount) || 0;
    const advance = parseFloat(advancePayment) || 0;
    
    if (total < 0 || advance < 0) {
      toast({ title: 'Xatolik', description: "Qiymatlar manfiy bo‘lmasin", variant: 'destructive' });
      return;
    }
    
    if (advance > total) {
      toast({ title: 'Xatolik', description: "Avans to'lov jami summadan ko'p bo'lishi mumkin emas", variant: 'destructive' });
      return;
    }
    
    try {
      if (editing.id) {
        await update(editing.id, {
          name,
          description: description?.trim() || '',
          totalAmount: total,
          paymentType,
          advancePayment: advance,
        });
        toast({ title: 'Yangilandi', description: 'Rasxod yangilandi' });
      } else {
        await add({
          name,
          description: description?.trim() || '',
          totalAmount: total,
          paymentType,
          advancePayment: advance,
        });
        toast({ title: 'Qo‘shildi', description: 'Rasxod qo‘shildi' });
      }
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e?.message || 'Saqlashda xatolik', variant: 'destructive' });
      return;
    } finally {
      setIsDialogOpen(false);
      setEditing(null);
    }
  };

  const openPaymentModal = async (expense: DailyExpense) => {
    setSelectedExpense(expense);
    setIsPaymentModalOpen(true);
    await loadPaymentHistory(expense.id);
  };

  const loadPaymentHistory = async (expenseId: string) => {
    try {
      const records = await getPaymentRecords(expenseId);
      setPaymentRecords(records || []);
    } catch (e: any) {
      toast({ title: 'Xatolik', description: 'To\'lovlar tarixini yuklashda xatolik', variant: 'destructive' });
    }
  };

  const handleAddPayment = async () => {
    if (!selectedExpense) return;
    
    const amount = parseFloat(newPayment.amount) || 0;
    if (amount <= 0) {
      toast({ title: 'Xatolik', description: 'To\'lov summasi 0 dan katta bo\'lishi kerak', variant: 'destructive' });
      return;
    }
    
    try {
      await savePaymentRecords(selectedExpense.id, [{
        amount,
        paymentType: 'payment',
        description: newPayment.description.trim() || '',
        paymentDate: newPayment.paymentDate,
        paymentMethod: newPayment.paymentType,
      }]);
      
      toast({ title: 'Muvaffaqiyatli', description: 'To\'lov qo\'shildi' });
      setNewPayment({ amount: '', description: '', paymentType: 'cash', paymentDate: new Date().toISOString().split('T')[0] });
      await load();
      await loadPaymentHistory(selectedExpense.id);
      // Fetch and update selectedExpense to reflect the new balance
      const { data: expenseData, error: expenseError } = await supabase
        .from('daily_expenses')
        .select(`
          *,
          expense_payment_records (
            amount,
            payment_type
          )
        `)
        .eq('id', selectedExpense.id)
        .single();
      
      if (!expenseError && expenseData) {
        const r: any = expenseData;
        const originalAdvance = parseFloat(r.advance_payment || 0);
        const additionalPayments = r.expense_payment_records?.reduce((sum: number, record: any) => {
          if (record.payment_type !== 'advance') {
            return sum + parseFloat(record.amount || 0);
          }
          return sum;
        }, 0) || 0;
        const totalPaid = originalAdvance + additionalPayments;
        const totalAmount = parseFloat(r.amount || 0);
        const remainingBalance = Math.max(0, totalAmount - totalPaid);
        
        const updatedExpense: DailyExpense = {
          id: r.id,
          name: r.name,
          totalAmount,
          paymentType: r.payment_type || 'cash',
          advancePayment: originalAdvance,
          remainingBalance,
          createdAt: new Date(r.created_at),
          updatedAt: new Date(r.updated_at),
        };
        setSelectedExpense(updatedExpense);
      }
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e?.message || 'To\'lov qo\'shishda xatolik', variant: 'destructive' });
    }
  };

  const handleDeletePayment = async (recordId: string) => {
    try {
      await deletePaymentRecord(recordId);
      toast({ title: 'Muvaffaqiyatli', description: 'To\'lov o\'chirildi' });
      if (selectedExpense) {
        await load();
        await loadPaymentHistory(selectedExpense.id);
        // Fetch and update selectedExpense to reflect the new balance
        const { data: expenseData, error: expenseError } = await supabase
          .from('daily_expenses')
          .select(`
            *,
            expense_payment_records (
              amount,
              payment_type
            )
          `)
          .eq('id', selectedExpense.id)
          .single();
        
        if (!expenseError && expenseData) {
          const r: any = expenseData;
          const originalAdvance = parseFloat(r.advance_payment || 0);
          const additionalPayments = r.expense_payment_records?.reduce((sum: number, record: any) => {
            if (record.payment_type !== 'advance') {
              return sum + parseFloat(record.amount || 0);
            }
            return sum;
          }, 0) || 0;
          const totalPaid = originalAdvance + additionalPayments;
          const totalAmount = parseFloat(r.amount || 0);
          const remainingBalance = Math.max(0, totalAmount - totalPaid);
          
          const updatedExpense: DailyExpense = {
            id: r.id,
            name: r.name,
            totalAmount,
            paymentType: r.payment_type || 'cash',
            advancePayment: originalAdvance,
            remainingBalance,
            createdAt: new Date(r.created_at),
            updatedAt: new Date(r.updated_at),
          };
          setSelectedExpense(updatedExpense);
        }
      }
    } catch (e: any) {
      toast({ title: 'Xatolik', description: e?.message || 'To\'lovni o\'chirishda xatolik', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex flex-col gap-3 mb-4">
        <div className="relative w-full md:max-w-sm">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish (rasxod nomi)"
            className="pl-8"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-max flex flex-col md:flex-row md:items-end gap-3">
          <div className="w-full md:w-52">
            <Label className="text-xs">To'lov turi</Label>
            <Select value={paymentTypeFilter} onValueChange={(v: any) => setPaymentTypeFilter(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Barchasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="cash">NAQD</SelectItem>
                <SelectItem value="click">CLICK</SelectItem>
                <SelectItem value="transfer">PERECHESLENIYE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="w-full md:w-44">
            <Label className="text-xs">Boshlanish sanasi</Label>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="w-full md:w-44">
            <Label className="text-xs">Tugash sanasi</Label>
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { const t=new Date(); const s=new Date(t.getFullYear(), t.getMonth(), t.getDate()); setStartDate(s.toISOString().split('T')[0]); setEndDate(s.toISOString().split('T')[0]); }}>Bugun</Button>
            <Button variant="outline" onClick={() => { const t=new Date(); const s=new Date(); s.setDate(t.getDate()-7); setStartDate(s.toISOString().split('T')[0]); setEndDate(t.toISOString().split('T')[0]); }}>7 kun</Button>
            <Button variant="outline" onClick={() => { const t=new Date(); const s=new Date(); s.setMonth(t.getMonth()-1); setStartDate(s.toISOString().split('T')[0]); setEndDate(t.toISOString().split('T')[0]); }}>1 oy</Button>
            <Button variant="ghost" onClick={() => { setStartDate(''); setEndDate(''); setPaymentTypeFilter('all'); }}>Tozalash</Button>
          </div>
          {!hideCreate && (
            <div className="md:ml-auto">
              <Button onClick={startCreate} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Rasxod qo‘shish
              </Button>
            </div>
          )}
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rasxod nomi</TableHead>
              <TableHead>Tavsif</TableHead>
              <TableHead className="text-right">Jami summa</TableHead>
              <TableHead className="text-center">To'lov turi</TableHead>
              <TableHead className="text-right">Avans</TableHead>
              <TableHead className="text-right">Qoldiq</TableHead>
              <TableHead className="text-center">Sana</TableHead>
              <TableHead className="w-[110px] text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.name}</TableCell>
                <TableCell className="max-w-[220px] truncate" title={(row as any).description || ''}>
                  {(row as any).description ? (row as any).description : <span className="text-muted-foreground">-</span>}
                </TableCell>
                <TableCell className="text-right">{formatCurrency(row.totalAmount)}</TableCell>
                <TableCell className="text-center">
                  <Badge className={getPaymentTypeColor(row.paymentType)}>
                    {getPaymentTypeLabel(row.paymentType)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {row.advancePayment > 0 ? (
                    <span className="text-green-600 font-medium">
                      {formatCurrency(row.advancePayment)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {row.remainingBalance > 0 ? (
                    <span className="text-orange-600 font-medium">
                      {formatCurrency(row.remainingBalance)}
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium">To'liq to'langan</span>
                  )}
                </TableCell>
                <TableCell className="text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1 text-sm">
                    <Calendar className="h-3 w-3" />
                    {formatDate(row.createdAt)}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => openPaymentModal(row)}
                      title="To'lovlar tarixi"
                    >
                      <History className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => startEdit(row)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="icon" onClick={() => handleDelete(row.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  {loading ? 'Yuklanmoqda...' : 'Ma’lumot topilmadi'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!o) { setIsDialogOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Rasxodni tahrirlash" : "Yangi rasxod"}</DialogTitle>
            <DialogDescription>Rasxod ma'lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="exp-name">Rasxod nomi</Label>
                <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                  {quickExpenseNames.map((label) => (
                    <Button
                      key={label}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing({ ...editing, name: label })}
                      className="rounded-full h-7 px-3 text-xs whitespace-nowrap"
                    >
                      {label}
                    </Button>
                  ))}
                </div>
                <Input
                  id="exp-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Masalan: Taksi, Kantselyariya ..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exp-desc">Tavsif (ixtiyoriy)</Label>
                <Input
                  id="exp-desc"
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="Qo'shimcha izoh"
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exp-amount">Jami summa</Label>
                  <NumericFormat
                    id="exp-amount"
                    value={editing.totalAmount}
                    onValueChange={(v) => setEditing({ ...editing, totalAmount: v.value })}
                    thousandSeparator=" "
                    allowNegative={false}
                    customInput={Input}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-payment-type">To'lov turi</Label>
                  <Select value={editing.paymentType} onValueChange={(v: any) => setEditing({ ...editing, paymentType: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">NAQD</SelectItem>
                      <SelectItem value="click">CLICK</SelectItem>
                      <SelectItem value="transfer">PERECHESLENIYE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-advance">Avans to'lov</Label>
                  <NumericFormat
                    id="exp-advance"
                    value={editing.advancePayment}
                    onValueChange={(v) => setEditing({ ...editing, advancePayment: v.value })}
                    thousandSeparator=" "
                    allowNegative={false}
                    customInput={Input}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-remaining">Qoldiq (avtomatik)</Label>
                  <Input
                    id="exp-remaining"
                    value={(() => {
                      const total = parseFloat(editing.totalAmount) || 0;
                      const advance = parseFloat(editing.advancePayment) || 0;
                      return formatCurrency(Math.max(0, total - advance));
                    })()}
                    readOnly
                    className="bg-muted"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditing(null); }}>Bekor qilish</Button>
                <Button onClick={save}>{editing.id ? 'Saqlash' : "Qo'shish"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment History Dialog */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>To'lovlar tarixi</DialogTitle>
            <DialogDescription>
              {selectedExpense?.name} - {selectedExpense && formatDate(selectedExpense.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <Label className="text-sm text-muted-foreground">Jami summa</Label>
                  <p className="text-lg font-semibold">{formatCurrency(selectedExpense.totalAmount)}</p>
                </div>
                <div>
                  <Label className="text-sm text-muted-foreground">Qoldiq</Label>
                  <p className={`text-lg font-semibold ${selectedExpense.remainingBalance > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedExpense.remainingBalance)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Yangi to'lov qo'shish</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment-amount">Summa</Label>
                    <NumericFormat
                      id="payment-amount"
                      value={newPayment.amount}
                      onValueChange={(v) => setNewPayment({ ...newPayment, amount: v.value })}
                      thousandSeparator=" "
                      allowNegative={false}
                      customInput={Input}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">To'lov turi</Label>
                    <Select value={newPayment.paymentType} onValueChange={(v: any) => setNewPayment({ ...newPayment, paymentType: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">NAQD</SelectItem>
                        <SelectItem value="click">CLICK</SelectItem>
                        <SelectItem value="transfer">PERECHESLENIYE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="payment-description">Tavsif (ixtiyoriy)</Label>
                    <Input
                      id="payment-description"
                      value={newPayment.description}
                      onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                      placeholder="To'lov haqida ma'lumot (ixtiyoriy)"
                    />
                  </div>
                </div>
                <Button onClick={handleAddPayment} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  To'lov qo'shish
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>To'lovlar ro'yxati</Label>
                <div className="border rounded-md max-h-64 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sana</TableHead>
                        <TableHead>Summa</TableHead>
                        <TableHead>Turi</TableHead>
                        <TableHead>Tavsif</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentRecords.map((record) => (
                        <TableRow key={record.id}>
                          <TableCell>{formatDate(record.createdAt)}</TableCell>
                          <TableCell>{formatCurrency(record.amount)}</TableCell>
                          <TableCell>
                            <Badge className={getPaymentTypeColor(record.paymentMethod || 'cash')}>
                              {getPaymentTypeLabel(record.paymentMethod || 'cash')}
                            </Badge>
                          </TableCell>
                          <TableCell>{record.description}</TableCell>
                          <TableCell>
                            {record.paymentType !== 'advance' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeletePayment(record.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {paymentRecords.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            To'lovlar mavjud emas
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyExpensesTable;

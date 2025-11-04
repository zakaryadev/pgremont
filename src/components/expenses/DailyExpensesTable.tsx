import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { NumericFormat } from 'react-number-format';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useDailyExpenses } from '@/hooks/useDailyExpenses';

export interface DailyExpenseItem {
  id: string;
  name: string;
  amount: number; // Rasxod summasi
  cash: number; // Naqd
  click: number; // Click
  transfer: number; // Perechisleniye
  createdAt: string;
  updatedAt: string;
}

interface DailyExpensesTableProps {
  onlyWithDebt?: boolean;
  hideCreate?: boolean;
}

export const DailyExpensesTable: React.FC<DailyExpensesTableProps> = ({ onlyWithDebt = false, hideCreate = false }) => {
  const { toast } = useToast();
  const { items, add, update, remove, loading } = useDailyExpenses();
  const [query, setQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editing, setEditing] = useState<DailyExpenseItem | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = items;
    if (onlyWithDebt) {
      base = base.filter((it) => Math.max(0, it.amount - (it.click + it.cash + it.transfer)) > 0);
    }
    if (!q) return base;
    return base.filter((it) => it.name.toLowerCase().includes(q));
  }, [items, query, onlyWithDebt]);

  const startCreate = () => {
    setEditing({
      id: '',
      name: '',
      amount: 0,
      cash: 0,
      click: 0,
      transfer: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setIsDialogOpen(true);
  };

  const startEdit = (row: DailyExpenseItem) => {
    setEditing({ ...row });
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
    const { name, amount, cash, click, transfer } = editing;
    if (!name.trim()) {
      toast({ title: 'Xatolik', description: "Rasxod nomi kerak", variant: 'destructive' });
      return;
    }
    if (amount < 0 || cash < 0 || click < 0 || transfer < 0) {
      toast({ title: 'Xatolik', description: "Qiymatlar manfiy bo‘lmasin", variant: 'destructive' });
      return;
    }
    try {
      if (editing.id) {
        await update(editing.id, { name, amount, cash, click, transfer });
        toast({ title: 'Yangilandi', description: 'Rasxod yangilandi' });
      } else {
        await add({ id: '', name, amount, cash, click, transfer, createdAt: '', updatedAt: '' } as any);
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

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="relative w-full md:max-w-sm">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Qidirish (rasxod nomi)"
            className="pl-8"
          />
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        </div>
        {!hideCreate && (
          <div className="ml-auto">
            <Button onClick={startCreate} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Rasxod qo‘shish
            </Button>
          </div>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rasxod nomi</TableHead>
              <TableHead className="text-right">Rasxod summasi</TableHead>
              <TableHead className="text-right">Click</TableHead>
              <TableHead className="text-right">Naqd</TableHead>
              <TableHead className="text-right">Perechisleniye</TableHead>
              <TableHead className="text-right">Qarz</TableHead>
              <TableHead className="w-[110px] text-right">Amallar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => {
              const debt = Math.max(0, row.amount - (row.click + row.cash + row.transfer));
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell className="text-right">{row.amount.toLocaleString('en-US')}</TableCell>
                  <TableCell className="text-right">{row.click.toLocaleString('en-US')}</TableCell>
                  <TableCell className="text-right">{row.cash.toLocaleString('en-US')}</TableCell>
                  <TableCell className="text-right">{row.transfer.toLocaleString('en-US')}</TableCell>
                  <TableCell className={`text-right ${debt > 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                    {debt.toLocaleString('en-US')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="icon" onClick={() => startEdit(row)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(row.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  {loading ? 'Yuklanmoqda...' : 'Ma’lumot topilmadi'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(o) => { if (!o) { setIsDialogOpen(false); setEditing(null); } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Rasxodni tahrirlash" : "Yangi rasxod"}</DialogTitle>
            <DialogDescription>Rasxod ma’lumotlarini kiriting</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="exp-name">Rasxod nomi</Label>
                <Input
                  id="exp-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="Masalan: Taksi, Kantselyariya ..."
                />
              </div>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="exp-amount">Rasxod summasi</Label>
                  <NumericFormat
                    id="exp-amount"
                    value={editing.amount}
                    onValueChange={(v) => setEditing({ ...editing, amount: Number(v.value || 0) })}
                    thousandSeparator=" "
                    allowNegative={false}
                    customInput={Input}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-cash">Naqd</Label>
                  <NumericFormat
                    id="exp-cash"
                    value={editing.cash}
                    onValueChange={(v) => setEditing({ ...editing, cash: Number(v.value || 0) })}
                    thousandSeparator=" "
                    allowNegative={false}
                    customInput={Input}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-click">Click</Label>
                  <NumericFormat
                    id="exp-click"
                    value={editing.click}
                    onValueChange={(v) => setEditing({ ...editing, click: Number(v.value || 0) })}
                    thousandSeparator=" "
                    allowNegative={false}
                    customInput={Input}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exp-transfer">Perechisleniye</Label>
                  <NumericFormat
                    id="exp-transfer"
                    value={editing.transfer}
                    onValueChange={(v) => setEditing({ ...editing, transfer: Number(v.value || 0) })}
                    thousandSeparator=" "
                    allowNegative={false}
                    customInput={Input}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => { setIsDialogOpen(false); setEditing(null); }}>Bekor qilish</Button>
                <Button onClick={save}>{editing.id ? 'Saqlash' : "Qo‘shish"}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DailyExpensesTable;



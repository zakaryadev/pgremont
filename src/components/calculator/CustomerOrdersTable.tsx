import React, { useState, useMemo, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { uz } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Search,
  Edit,
  Trash2,
  Eye,
  Loader2,
  AlertCircle,
  Phone,
  Calendar,
  DollarSign,
  CreditCard,
  Filter,
  X,
  RefreshCw,
  Pause,
  Play,
  SlidersHorizontal,
  Calendar as CalendarIcon2,
  Download,
} from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { CustomerOrder, useCustomerOrders } from "@/hooks/useCustomerOrders";
import { useToast } from "@/hooks/use-toast";
import { EditCustomerOrderModal } from "./EditCustomerOrderModal";
import { PaymentRecordModal } from "./PaymentRecordModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import * as XLSX from 'xlsx';

interface CustomerOrdersTableProps {
  onEditOrder?: (order: CustomerOrder) => void;
  initialPaymentStatus?: 'all' | 'paid' | 'unpaid';
  initialShowFilters?: boolean;
  initialPartialOnly?: boolean;
  disableDefaultMonthRange?: boolean;
}

export function CustomerOrdersTable({ onEditOrder, initialPaymentStatus = 'all', initialShowFilters = false, initialPartialOnly = false, disableDefaultMonthRange = false }: CustomerOrdersTableProps) {
  const { orders, loading, error, deleteOrder, updateOrder, refreshOrders } =
    useCustomerOrders();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(
    null
  );
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<CustomerOrder | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);
  const [showFilters, setShowFilters] = useState(initialShowFilters);
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>(initialPaymentStatus);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all');
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(new Date());
  const [partialOnly, setPartialOnly] = useState<boolean>(initialPartialOnly);
  const daysScrollerRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const scrollLeftRef = useRef(0);

  // Compute current month range and days
  const now = new Date();
  const monthStart = useMemo(() => new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth(), 1), [currentMonthDate]);
  const monthEnd = useMemo(() => new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 0), [currentMonthDate]);
  const daysInMonth = monthEnd.getDate();

  // Keep selected month range in dateRange unless disabled; reset day filter when month changes
  useEffect(() => {
    if (!disableDefaultMonthRange) {
      setDateRange({ from: monthStart, to: monthEnd });
    }
    setSelectedDay('all');
  }, [monthStart, monthEnd, disableDefaultMonthRange]);

  // Filter orders based on search query, payment type, date range and other filters
  const filteredOrders = useMemo(() => {
    let filtered = [...orders];

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customerName.toLowerCase().includes(query) ||
          order.phoneNumber?.toLowerCase().includes(query) ||
          order.paymentType.toLowerCase().includes(query) ||
          order.id.toLowerCase().includes(query)
      );
    }

    // Filter by payment type
    if (paymentTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentType === paymentTypeFilter);
    }

    // Filter by date range (defaults to current month unless disabled)
    const effectiveFrom = disableDefaultMonthRange ? dateRange.from : (dateRange.from || monthStart);
    const effectiveTo = disableDefaultMonthRange ? dateRange.to : (dateRange.to || monthEnd);
    if (effectiveFrom || effectiveTo) {
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const fromValid = !effectiveFrom || orderDate >= effectiveFrom;
        const toValid = !effectiveTo || orderDate <= new Date(effectiveTo.getTime() + 24 * 60 * 60 * 1000); // Add 1 day to include the end date
        return fromValid && toValid;
      });
    }

    // Additional filter by selected day within the month
    if (selectedDay !== 'all') {
      filtered = filtered.filter(order => {
        const d = new Date(order.createdAt);
        return d.getDate() === selectedDay && d.getMonth() === monthStart.getMonth() && d.getFullYear() === monthStart.getFullYear();
      });
    }

    // Filter by payment status
    if (paymentStatusFilter === 'paid') {
      filtered = filtered.filter((order) => order.remainingBalance <= 0);
    } else if (paymentStatusFilter === 'unpaid') {
      filtered = filtered.filter((order) => order.remainingBalance > 0);
      if (partialOnly) {
        filtered = filtered.filter((order) => order.remainingBalance < order.totalAmount);
      }
    }

    return filtered;
  }, [orders, searchQuery, paymentTypeFilter, paymentStatusFilter, dateRange, selectedDay, monthStart, partialOnly, disableDefaultMonthRange]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const time = date.toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${day}.${month}.${year}, ${time}`;
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "cash":
        return "NAQD";
      case "click":
        return "CLICK";
      case "transfer":
        return "PERECHESLENIYA";
      default:
        return type;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case "cash":
        return "bg-green-100 text-green-800";
      case "click":
        return "bg-blue-100 text-blue-800";
      case "transfer":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      "Bu mijoz buyurtmasini o'chirishni xohlaysizmi?\n\n" +
        "Bu amalni bekor qilib bo'lmaydi!"
    );

    if (!confirmed) return;

    try {
      setDeletingId(orderId);
      await deleteOrder(orderId);
      toast({
        title: "Muvaffaqiyatli o'chirildi",
        description: "Mijoz buyurtmasi o'chirildi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtmani o'chirishda xatolik yuz berdi",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditOrder = (order: CustomerOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingOrder(order);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData: Partial<CustomerOrder>) => {
    if (!editingOrder) return;

    try {
      await updateOrder(editingOrder.id, updatedData);
      toast({
        title: "Muvaffaqiyatli yangilandi",
        description: `${updatedData.customerName} uchun ma'lumotlar yangilandi`,
      });
      setIsEditModalOpen(false);
      setEditingOrder(null);
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleViewOrder = (order: CustomerOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrder(order);
  };

  const handlePaymentRecord = (order: CustomerOrder, e: React.MouseEvent) => {
    e.stopPropagation();
    setPaymentOrder(order);
    setIsPaymentModalOpen(true);
  };

  const handleSavePaymentRecord = async (
    orderId: string,
    paymentRecords: any[]
  ) => {
    try {
      // Payment records are already saved in the modal
      // Just refresh the orders to show updated data
      await refreshOrders();
      toast({
        title: "Muvaffaqiyatli yangilandi",
        description: "Buyurtma ma'lumotlari yangilandi",
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Ma'lumotlarni yangilashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // Calculate totals for filtered orders
  const totals = useMemo(() => {
    return filteredOrders.reduce((acc, order) => {
      acc.totalAmount += order.totalAmount;
      acc.advancePayment += order.advancePayment;
      acc.remainingBalance += order.remainingBalance;
      return acc;
    }, { totalAmount: 0, advancePayment: 0, remainingBalance: 0 });
  }, [filteredOrders]);

  const handleExportToExcel = () => {
    try {
      const data = filteredOrders.map((order) => ({
        'Mijoz nomi': order.customerName,
        'Telefon': order.phoneNumber || '',
        'Jami summa': order.totalAmount,
        'To\'lov turi': getPaymentTypeLabel(order.paymentType),
        'Avans': order.advancePayment,
        'Qoldiq': order.remainingBalance,
        'Sana': formatDate(order.createdAt),
        'ID': order.id,
      }));

      // Jami qator qo'shish
      const totalsRow = {
        'Mijoz nomi': 'JAMI',
        'Telefon': '',
        'Jami summa': totals.totalAmount,
        'To\'lov turi': '',
        'Avans': totals.advancePayment,
        'Qoldiq': totals.remainingBalance,
        'Sana': '',
        'ID': '',
      };

      const ws = XLSX.utils.json_to_sheet([...data, totalsRow]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Buyurtmalar');

      // Fayl nomi
      const fileName = `buyurtmalar_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({ 
        title: 'Muvaffaqiyatli', 
        description: 'Excel fayli yuklab olindi' 
      });
    } catch (e: any) {
      toast({ 
        title: 'Xatolik', 
        description: e?.message || 'Excel faylini yaratishda xatolik', 
        variant: 'destructive' 
      });
    }
  };

  // Auto refresh every 3 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      refreshOrders();
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshOrders]);

  // Hide fully paid orders instead of deleting them
  // This preserves payment history while keeping the interface clean

  return (
    <div className="space-y-4">
      {/* Search and Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">
                Saqlangan mijoz buyurtmalari
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Jami: {orders.length} ta buyurtma
                {filteredOrders.length !== orders.length && (
                  <span className="ml-2 text-primary">
                    (Ko'rsatilmoqda: {filteredOrders.length} ta)
                  </span>
                )}
                {autoRefreshEnabled && (
                  <span className="ml-2 text-green-600 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Avtomatik yangilash yoqilgan
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Qidirish..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2"
                >
                  <Filter className="h-4 w-4" />
                  Filtrlash
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshOrders}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Yangilash
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportToExcel}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Excel
                </Button>

                <Button
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className="flex items-center gap-2"
                  title={
                    autoRefreshEnabled
                      ? "Avtomatik yangilashni to'xtatish"
                      : "Avtomatik yangilashni yoqish"
                  }
                >
                  {autoRefreshEnabled ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {autoRefreshEnabled ? "To'xtatish" : "Yoqish"}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Month Navigator + Day Selector (draggable) */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                title="Oldingi oy"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm text-muted-foreground min-w-[140px] text-center">
                {format(monthStart, "LLLL yyyy", { locale: uz })}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonthDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                title="Keyingi oy"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={selectedDay === 'all' ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDay('all')}
              >
                Barcha kunlar
              </Button>
            </div>
          </div>
          <div
            ref={daysScrollerRef}
            className="flex gap-2 overflow-x-auto select-none cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => {
              isDraggingRef.current = true;
              dragStartXRef.current = e.pageX - (daysScrollerRef.current?.offsetLeft || 0);
              scrollLeftRef.current = daysScrollerRef.current?.scrollLeft || 0;
            }}
            onMouseLeave={() => { isDraggingRef.current = false; }}
            onMouseUp={() => { isDraggingRef.current = false; }}
            onMouseMove={(e) => {
              if (!isDraggingRef.current || !daysScrollerRef.current) return;
              e.preventDefault();
              const x = e.pageX - daysScrollerRef.current.offsetLeft;
              const walk = (x - dragStartXRef.current) * 1; // scroll speed
              daysScrollerRef.current.scrollLeft = scrollLeftRef.current - walk;
            }}
            onTouchStart={(e) => {
              isDraggingRef.current = true;
              dragStartXRef.current = e.touches[0].pageX - (daysScrollerRef.current?.offsetLeft || 0);
              scrollLeftRef.current = daysScrollerRef.current?.scrollLeft || 0;
            }}
            onTouchEnd={() => { isDraggingRef.current = false; }}
            onTouchMove={(e) => {
              if (!isDraggingRef.current || !daysScrollerRef.current) return;
              const x = e.touches[0].pageX - daysScrollerRef.current.offsetLeft;
              const walk = (x - dragStartXRef.current) * 1;
              daysScrollerRef.current.scrollLeft = scrollLeftRef.current - walk;
            }}
          >
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const isToday = day === now.getDate() && now.getMonth() === monthStart.getMonth() && now.getFullYear() === monthStart.getFullYear();
              const isActive = selectedDay === day;
              return (
                <Button
                  key={day}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  className={isToday ? "border-primary" : undefined}
                  onClick={() => setSelectedDay(day)}
                >
                  {day}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="overflow-visible">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>To'lov turi</Label>
                <Select
                  value={paymentTypeFilter}
                  onValueChange={setPaymentTypeFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="To'lov turi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barcha to'lov turlari</SelectItem>
                    <SelectItem value="cash">Naqd pul</SelectItem>
                    <SelectItem value="click">Click</SelectItem>
                    <SelectItem value="transfer">O'tkazma</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>To'lov holati</Label>
                <Select
                  value={paymentStatusFilter}
                  onValueChange={setPaymentStatusFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="To'lov holati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="paid">To'liq to'langan</SelectItem>
                    <SelectItem value="unpaid">Qarzdor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Boshlanish sanasi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.from ? (
                        format(dateRange.from, "PPP", { locale: uz })
                      ) : (
                        <span>Sanani tanlang</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, from: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Tugash sanasi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateRange.to && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange.to ? (
                        format(dateRange.to, "PPP", { locale: uz })
                      ) : (
                        <span>Sanani tanlang</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) => setDateRange(prev => ({ ...prev, to: date }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setPaymentTypeFilter('all');
                  setPaymentStatusFilter('all');
                  setSelectedDay('all');
                  setDateRange({ from: monthStart, to: monthEnd });
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Filtrlarni tozalash
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button
              variant="outline"
              size="sm"
              onClick={refreshOrders}
              className="ml-2"
            >
              Qayta urinish
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Data Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
              <p>Buyurtmalar yuklanmoqda...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Hali hech qanday mijoz buyurtmasi saqlanmagan</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Qidiruv natijasida buyurtma topilmadi</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearSearch}
                className="mt-2"
              >
                Qidiruvni tozalash
              </Button>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <div className="max-h-[70vh] overflow-y-auto w-full">
                <Table className="min-w-[720px] md:min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Mijoz</TableHead>
                    <TableHead className="hidden sm:table-cell">Telefon</TableHead>
                    <TableHead>Jami summa</TableHead>
                    <TableHead>To'lov turi</TableHead>
                      <TableHead className="hidden sm:table-cell">Avans</TableHead>
                    <TableHead>Qoldiq</TableHead>
                      <TableHead className="hidden sm:table-cell">Sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {order.customerName}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {order.phoneNumber ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.phoneNumber}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-primary whitespace-nowrap">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={getPaymentTypeColor(order.paymentType)}
                        >
                          {getPaymentTypeLabel(order.paymentType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {order.advancePayment > 0 ? (
                          <span className="text-green-600 font-medium">
                            {formatCurrency(order.advancePayment)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.remainingBalance > 0 ? (
                          <div className="flex flex-col">
                            <span className="text-orange-600 font-medium">
                              {formatCurrency(order.remainingBalance)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Qism to'langan
                            </span>
                          </div>
                        ) : (
                          <div className="flex flex-col">
                            <span className="text-green-600 font-medium">
                              To'liq to'langan
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleViewOrder(order, e)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title="Ko'rish"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handlePaymentRecord(order, e)}
                            className="h-8 w-8 p-0 text-purple-600 hover:text-purple-700"
                            title="To'lov qaydnomasi"
                          >
                            <DollarSign className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEditOrder(order, e)}
                            className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                            title="Tahrirlash"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {user?.role === 'admin' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteOrder(order.id, e)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              disabled={deletingId === order.id}
                              title="O'chirish"
                            >
                              {deletingId === order.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog
          open={!!selectedOrder}
          onOpenChange={() => setSelectedOrder(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mijoz buyurtmasi tafsilotlari</DialogTitle>
              <DialogDescription>
                {selectedOrder.customerName} -{" "}
                {formatDate(selectedOrder.createdAt)}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Mijoz nomi</Label>
                  <p className="text-sm">{selectedOrder.customerName}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Telefon raqami</Label>
                  <p className="text-sm">
                    {selectedOrder.phoneNumber || "Kiritilmagan"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Jami summa</Label>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">To'lov turi</Label>
                  <Badge
                    className={getPaymentTypeColor(selectedOrder.paymentType)}
                  >
                    {getPaymentTypeLabel(selectedOrder.paymentType)}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Avans to'lovi</Label>
                  <p className="text-sm text-green-600 font-medium">
                    {formatCurrency(selectedOrder.advancePayment)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Qolgan summa</Label>
                  <p className="text-sm text-orange-600 font-medium">
                    {formatCurrency(selectedOrder.remainingBalance)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Yaratilgan: {formatDate(selectedOrder.createdAt)}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Yangilangan: {formatDate(selectedOrder.updatedAt)}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Order Modal */}
      <EditCustomerOrderModal
        order={editingOrder}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingOrder(null);
        }}
        onSave={handleSaveEdit}
      />

      {/* Payment Record Modal */}
      <PaymentRecordModal
        order={paymentOrder}
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentOrder(null);
        }}
        onSave={handleSavePaymentRecord}
      />
    </div>
  );
}

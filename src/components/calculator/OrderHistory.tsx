import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Trash2, Calendar, DollarSign, Package, Eye, Loader2, AlertCircle, Phone, Filter, X, ChevronDown, ChevronUp, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Order } from '../../types/calculator';
import { useOrders } from '../../hooks/useOrders';
import { OrderReceipt } from './OrderReceipt';

interface OrderHistoryProps {
  onLoadOrder?: (order: Order) => void;
  isOpen?: boolean;
  onClose?: () => void;
  refreshTrigger?: number; // Add a trigger to force refresh
  calculatorType?: 'polygraphy' | 'tablets' | 'letters'; // Filter orders by calculator type
}

export function OrderHistory({ onLoadOrder, isOpen: externalIsOpen, onClose, refreshTrigger, calculatorType }: OrderHistoryProps) {
  const { orders, loading, error, deleteOrder, clearAllOrders, refreshOrders } = useOrders();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [materialFilter, setMaterialFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [printOrder, setPrintOrder] = useState<Order | null>(null);

  // Use external isOpen if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Refresh orders when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      refreshOrders();
    }
  }, [refreshTrigger]); // Remove refreshOrders from dependencies

  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const orderDate = new Date(date);
    const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
    
    // Agar bugun bo'lsa
    if (orderDateOnly.getTime() === today.getTime()) {
      return `Bugun, ${orderDate.toLocaleTimeString('uz-UZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Agar kecha bo'lsa
    if (orderDateOnly.getTime() === yesterday.getTime()) {
      return `Kecha, ${orderDate.toLocaleTimeString('uz-UZ', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })}`;
    }
    
    // Boshqa hollarda to'liq sana - O'zbek tilida tushunarli format
    const day = orderDate.getDate();
    const month = orderDate.toLocaleDateString('uz-UZ', { month: 'long' });
    const year = orderDate.getFullYear();
    const time = orderDate.toLocaleTimeString('uz-UZ', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    return `${day} ${month} ${year}, ${time}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  // Get materials relevant to the current calculator type
  const getRelevantMaterials = () => {
    if (calculatorType === 'polygraphy') {
      return [
        { value: 'banner', label: 'Баннер' },
        { value: 'oracal', label: 'Оракал' },
        { value: 'setka', label: 'Сеточный оракал' },
        { value: 'prozrachka', label: 'Прозрачный оракал' },
        { value: 'holst', label: 'Холст' },
        { value: 'bekprint', label: 'Бекпринт' }
      ];
    } else if (calculatorType === 'tablets') {
      return [
        { value: 'romark', label: 'Romark tablichka' },
        { value: 'plexiglass', label: 'Orgsteklo (Plexiglass) tablichka' },
        { value: 'acrylic', label: 'Akril tablichka' },
        { value: 'badge', label: 'Beydjik (7x4 cm)' },
        { value: 'premium_badge', label: 'Premium beydjik (7x4 cm)' },
        { value: 'statue', label: 'Statuetka (Acrylic)' },
        { value: 'bolt', label: 'Distansion bolt' },
        { value: 'stand_orgsteklo_3mm', label: 'Stend Orgsteklo (3mm)' },
        { value: 'stand_orgsteklo_5mm', label: 'Stend Orgsteklo (5mm)' },
        { value: 'stand_alyukabond', label: 'Stend Alyukabond' },
        { value: 'stand_fomiks', label: 'Stend Fomiks' }
      ];
    } else if (calculatorType === 'letters') {
      return [
        { value: 'volumetric_no_led', label: 'Обьемная буква (Без диод)' },
        { value: 'volumetric_simple', label: 'Обьемная буква (Простой)' },
        { value: 'volumetric_mesh', label: 'Обьемная буква (Сеточний)' },
        { value: 'volumetric_contour', label: 'Обьемная буква (Контройорный)' },
        { value: 'volumetric_acrylic_border', label: 'Обьемная буква (Борт акрил)' },
        { value: 'volumetric_dotted', label: 'Обьемная буква (Точечные)' },
        { value: 'light_box', label: 'Световой короб (акрил)' },
        { value: 'fabric_light_box', label: 'Тканевые световые короба' }
      ];
    }
    return []; // Return empty array if no calculator type specified
  };

  // Get services relevant to the current calculator type
  const getRelevantServices = () => {
    if (calculatorType === 'polygraphy') {
      return [
        { value: 'none', label: 'Xizmat yo\'q' },
        { value: 'banner_ustanovka', label: 'Установка баннера' },
        { value: 'banner_ustanovka_reika', label: 'Установка баннера с рейкой' },
        { value: 'banner_bez_ustanovki_reika', label: 'Без установки с рейкой' },
        { value: 'holst_ustanovka', label: 'Установка холста' },
        { value: 'holst_ustanovka_reika', label: 'Установка холста с рейкой' },
        { value: 'oracal_ustanovka', label: 'Установка оракала' },
        { value: 'oracal_ustanovka_demontaj', label: 'Установка + демонтаж оракала' }
      ];
    } else if (calculatorType === 'tablets' || calculatorType === 'letters') {
      return [
        { value: 'none', label: 'Xizmat yo\'q' }
      ];
    }
    return []; // Return empty array if no calculator type specified
  };

  // Filter orders based on all filters
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      // Calculator type filter - show only orders from the current calculator
      if (calculatorType && order.calculatorType !== calculatorType) {
        return false;
      }
      // Date filter
      if (dateFilter !== 'all') {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const orderDate = new Date(order.createdAt);
        const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

        switch (dateFilter) {
          case 'today':
            if (orderDateOnly.getTime() !== today.getTime()) return false;
            break;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (orderDateOnly < weekAgo) return false;
            break;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (orderDateOnly < monthAgo) return false;
            break;
          case 'custom':
            if (customStartDate && customEndDate) {
              const startDate = new Date(customStartDate);
              const endDate = new Date(customEndDate);
              endDate.setHours(23, 59, 59, 999);
              if (orderDate < startDate || orderDate > endDate) return false;
            }
            break;
        }
      }

      // Material filter
      if (materialFilter !== 'all') {
        if (order.state.selectedMaterial !== materialFilter) return false;
      }

      // Service filter
      if (serviceFilter !== 'all') {
        if (order.state.selectedService !== serviceFilter) return false;
      }

      // Price range filter
      if (priceRangeFilter !== 'all') {
        const totalCost = order.results.totalCost;
        switch (priceRangeFilter) {
          case 'low':
            if (totalCost >= 500000) return false; // 500,000 dan kam
            break;
          case 'medium':
            if (totalCost < 500000 || totalCost >= 2000000) return false; // 500,000 - 2,000,000
            break;
          case 'high':
            if (totalCost < 2000000) return false; // 2,000,000 dan yuqori
            break;
        }
      }


      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nameMatch = order.name.toLowerCase().includes(query);
        const phoneMatch = order.phone?.toLowerCase().includes(query);
        if (!nameMatch && !phoneMatch) return false;
      }

      return true;
    });
  }, [orders, calculatorType, dateFilter, customStartDate, customEndDate, materialFilter, serviceFilter, priceRangeFilter, searchQuery]);

  const clearFilters = () => {
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setMaterialFilter('all');
    setServiceFilter('all');
    setPriceRangeFilter('all');
    setSearchQuery('');
  };

  const exportToExcel = async () => {
    try {
      setIsExporting(true);
      
      // Prepare data for Excel
      const excelData = filteredOrders.map((order, index) => {
        const orderDate = new Date(order.createdAt);
        const day = orderDate.getDate().toString().padStart(2, '0');
        const month = (orderDate.getMonth() + 1).toString().padStart(2, '0');
        const year = orderDate.getFullYear();
        const hours = orderDate.getHours().toString().padStart(2, '0');
        const minutes = orderDate.getMinutes().toString().padStart(2, '0');
        const formattedDate = `${day}.${month}.${year}`;
        const formattedTime = `${hours}:${minutes}`;

        return {
          '№': index + 1,
          'Buyurtma nomi': order.name,
          'Sana': formattedDate,
          'Vaqt': formattedTime,
          'Telefon': order.phone || '',
          'Material': order.materials[order.state.selectedMaterial]?.name || '',
          'Mahsulotlar soni': order.state.items.length,
          'Xizmat': order.services[order.state.selectedService]?.name || 'Xizmat yo\'q',
          'Jami narx': order.results.totalCost,
          'Pechat maydoni (m²)': order.results.totalPrintArea.toFixed(2),
          'Material ishlatilgan (m²)': order.results.totalMaterialUsed.toFixed(2),
          'Chiqindi (m²)': order.results.totalWaste.toFixed(2),
          'Chiqindi foizi (%)': order.results.wastePercentage.toFixed(1),
          'Material narxi': order.results.materialCost,
          'Pechat narxi': order.results.printCost,
          'Chiqindi narxi': order.results.wasteCost,
          'Xizmat narxi': order.results.serviceCost
        };
      });

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = [
        { wch: 5 },   // №
        { wch: 25 },  // Buyurtma nomi
        { wch: 12 },  // Sana
        { wch: 8 },   // Vaqt
        { wch: 15 },  // Telefon
        { wch: 20 },  // Material
        { wch: 15 },  // Mahsulotlar soni
        { wch: 25 },  // Xizmat
        { wch: 15 },  // Jami narx
        { wch: 18 },  // Pechat maydoni
        { wch: 20 },  // Material ishlatilgan
        { wch: 15 },  // Chiqindi
        { wch: 15 },  // Chiqindi foizi
        { wch: 15 },  // Material narxi
        { wch: 15 },  // Pechat narxi
        { wch: 15 },  // Chiqindi narxi
        { wch: 15 }   // Xizmat narxi
      ];
      ws['!cols'] = colWidths;

      // Style headers with background color
      const headerStyle = {
        fill: {
          fgColor: { rgb: "4472C4" } // Blue background
        },
        font: {
          bold: true,
          color: { rgb: "FFFFFF" } // White text
        },
        alignment: {
          horizontal: "center",
          vertical: "center"
        }
      };

      // Apply header styles
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        
        ws[cellAddress].s = headerStyle;
      }

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Buyurtmalar');

      // Generate filename with current date
      const currentDate = new Date().toLocaleDateString('uz-UZ').replace(/\//g, '-');
      const filename = `Buyurtmalar_${currentDate}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);
      
    } catch (error) {
      console.error('Excel export xatosi:', error);
      alert('Excel faylini yuklab olishda xatolik yuz berdi!');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Show confirmation dialog
    const confirmed = window.confirm(
      'Bu buyurtmani o\'chirishni xohlaysizmi?\n\n' +
      'Bu amalni bekor qilib bo\'lmaydi!'
    );
    
    if (!confirmed) {
      return; // User cancelled deletion
    }
    
    try {
      setDeletingId(orderId);
      await deleteOrder(orderId);
    } catch (error) {
      console.error('Failed to delete order:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAllOrders = async () => {
    // Show confirmation dialog for clearing all orders
    const confirmed = window.confirm(
      'BARCHA BUYURTMALARNI O\'CHIRISHNI XOHLAYSIZMI?\n\n' +
      'Bu amal barcha saqlangan buyurtmalarni butunlay o\'chiradi!\n' +
      'Bu amalni bekor qilib bo\'lmaydi!\n\n' +
      'Davom etishni xohlaysizmi?'
    );
    
    if (!confirmed) {
      return; // User cancelled
    }
    
    try {
      setClearing(true);
      await clearAllOrders();
      // Show success message
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Barcha buyurtmalar muvaffaqiyatli o\'chirildi!');
      }
    } catch (error) {
      console.error('Failed to clear all orders:', error);
      // Show error message
      if (typeof window !== 'undefined' && window.alert) {
        window.alert('Buyurtmalarni o\'chirishda xatolik yuz berdi: ' + (error instanceof Error ? error.message : 'Noma\'lum xatolik'));
      }
    } finally {
      setClearing(false);
    }
  };

  const handleLoadOrder = (order: Order) => {
    if (onLoadOrder) {
      onLoadOrder(order);
    }
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const handleShowReceipt = (order: Order, e: React.MouseEvent) => {
    e.stopPropagation();
    setPrintOrder(order);
  };

  // Refresh orders when dialog opens
  const handleDialogOpen = (open: boolean) => {
    if (onClose) {
      if (open) {
        refreshOrders();
      } else {
        onClose();
      }
    } else {
      setInternalIsOpen(open);
      if (open) {
        refreshOrders();
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleDialogOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Buyurtmalar tarixi</DialogTitle>
          <DialogDescription>
            Saqlangan barcha buyurtmalarni ko'ring va boshqaring
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-1">
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

          {/* Filter Controls */}
          {orders.length > 0 && (
            <Card className="w-[80%] mx-auto">
              <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="text-base flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Filtrlash
                      </div>
                      {isFiltersOpen ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {/* Search */}
                    <div className="space-y-2">
                      <Label htmlFor="search">Qidiruv</Label>
                      <Input
                        id="search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Klient nomi yoki telefon raqami bo'yicha qidiring..."
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                      <div className="space-y-2">
                        <Label htmlFor="date-filter">Sana bo'yicha</Label>
                        <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sana tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Barcha buyurtmalar</SelectItem>
                            <SelectItem value="today">Bugun</SelectItem>
                            <SelectItem value="week">Oxirgi hafta</SelectItem>
                            <SelectItem value="month">Oxirgi oy</SelectItem>
                            <SelectItem value="custom">Maxsus sana</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="material-filter">Material bo'yicha</Label>
                        <Select value={materialFilter} onValueChange={setMaterialFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Material tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Barcha materiallar</SelectItem>
                            {getRelevantMaterials().map((material) => (
                              <SelectItem key={material.value} value={material.value}>
                                {material.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="service-filter">Xizmat bo'yicha</Label>
                        <Select value={serviceFilter} onValueChange={setServiceFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Xizmat tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Barcha xizmatlar</SelectItem>
                            {getRelevantServices().map((service) => (
                              <SelectItem key={service.value} value={service.value}>
                                {service.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="price-filter">Narx oralig'i</Label>
                        <Select value={priceRangeFilter} onValueChange={(value: any) => setPriceRangeFilter(value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Narx oralig'ini tanlang" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Barcha narxlar</SelectItem>
                            <SelectItem value="low">500,000 so'm dan kam</SelectItem>
                            <SelectItem value="medium">500,000 - 2,000,000 so'm</SelectItem>
                            <SelectItem value="high">2,000,000 so'm dan yuqori</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {dateFilter === 'custom' && (
                      <div className="space-y-2">
                        <Label>Maxsus sana oralig'i</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            placeholder="Boshlanish sanasi"
                          />
                          <Input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            placeholder="Tugash sanasi"
                          />
                        </div>
                      </div>
                    )}
                    
                    {(dateFilter !== 'all' || materialFilter !== 'all' || serviceFilter !== 'all' || priceRangeFilter !== 'all' || searchQuery.trim()) && (
                      <div className="flex justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          className="flex items-center gap-2"
                        >
                          <X className="h-4 w-4" />
                          Filtrlarni tozalash
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {orders.length > 0 && (
            <div className="flex justify-between items-center w-[80%] mx-auto">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  Jami: {orders.length} ta buyurtma
                </Badge>
                {filteredOrders.length !== orders.length && (
                  <Badge variant="outline">
                    Ko'rsatilmoqda: {filteredOrders.length} ta
                  </Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={exportToExcel}
                  disabled={isExporting || filteredOrders.length === 0}
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Excel
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleClearAllOrders}
                  disabled={clearing}
                >
                  {clearing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Barchasini o'chirish
                </Button>
              </div>
            </div>
          )}

          <ScrollArea className="h-[400px]">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
                <p>Buyurtmalar yuklanmoqda...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Hali hech qanday buyurtma saqlanmagan</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Tanlangan filtrlarda buyurtma topilmadi</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-2"
                >
                  Filtrlarni tozalash
                </Button>
              </div>
            ) : (
              <div className="space-y-2 pb-1">
                {filteredOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow w-[80%] mx-auto"
                    onClick={() => handleLoadOrder(order)}
                  >
                    <CardHeader className="pb-1 pt-2 px-2 sm:px-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xs sm:text-sm truncate">{order.name}</CardTitle>
                          <CardDescription className="text-xs mt-0.5">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span className="truncate text-xs">{formatDate(order.createdAt)}</span>
                            </div>
                            {order.phone && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Phone className="h-3 w-3" />
                                <span className="truncate text-xs">{order.phone}</span>
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleShowReceipt(order, e)}
                            className="text-green-600 hover:text-green-700 h-5 w-5 sm:h-6 sm:w-6 p-0"
                            title="Chekni ko'rish va PDF yuklash"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleDeleteOrder(order.id, e)}
                            className="text-destructive hover:text-destructive h-5 w-5 sm:h-6 sm:w-6 p-0"
                            disabled={deletingId === order.id}
                            title="Buyurtmani o'chirish"
                          >
                            {deletingId === order.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 pb-2 px-2 sm:px-3">
                      <div className="space-y-1 sm:grid sm:grid-cols-2 sm:gap-1 sm:space-y-0 text-xs">
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">Material:</span>
                          <span className="font-medium text-xs">{order.materials[order.state.selectedMaterial]?.name || 'Tanlanmagan'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">Mahsulotlar:</span>
                          <span className="font-medium text-xs">{order.state.items.length} ta</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">Xizmat:</span>
                          <span className="font-medium text-xs">{order.services[order.state.selectedService]?.name || 'Xizmat yo\'q'}</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-muted-foreground text-xs">Narx:</span>
                          <span className="font-medium text-primary text-xs">
                            {formatCurrency(order.results.finalCost)}
                          </span>
                          {order.results.discountAmount > 0 && (
                            <span className="text-green-600 text-xs">
                              (Skidka: {order.state.discountPercentage}%)
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>

      {/* Print Receipt Dialog */}
      {printOrder && (
        <Dialog open={!!printOrder} onOpenChange={() => setPrintOrder(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Chekni ko'rish va yuklash</DialogTitle>
              <DialogDescription>
                {printOrder.name} buyurtmasi uchun chek - PDF yuklash yoki chop etish
              </DialogDescription>
            </DialogHeader>
            <OrderReceipt order={printOrder} />
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}

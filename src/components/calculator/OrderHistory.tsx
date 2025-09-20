import { useState, useMemo } from 'react';
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
import { Trash2, Calendar, DollarSign, Package, Eye, Loader2, AlertCircle, Phone, Filter, X } from 'lucide-react';
import { Order } from '../../types/calculator';
import { useOrders } from '../../hooks/useOrders';

interface OrderHistoryProps {
  onLoadOrder?: (order: Order) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function OrderHistory({ onLoadOrder, isOpen: externalIsOpen, onClose }: OrderHistoryProps) {
  const { orders, loading, error, deleteOrder, clearAllOrders, refreshOrders } = useOrders();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Use external isOpen if provided, otherwise use internal state
  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  // Filter orders based on date selection
  const filteredOrders = useMemo(() => {
    if (dateFilter === 'all') return orders;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

      switch (dateFilter) {
        case 'today':
          return orderDateOnly.getTime() === today.getTime();
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return orderDateOnly >= weekAgo;
        case 'month':
          const monthAgo = new Date(today);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return orderDateOnly >= monthAgo;
        case 'custom':
          if (!customStartDate || !customEndDate) return true;
          const startDate = new Date(customStartDate);
          const endDate = new Date(customEndDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          return orderDate >= startDate && orderDate <= endDate;
        default:
          return true;
      }
    });
  }, [orders, dateFilter, customStartDate, customEndDate]);

  const clearFilters = () => {
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
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
    try {
      setClearing(true);
      await clearAllOrders();
    } catch (error) {
      console.error('Failed to clear all orders:', error);
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
        
        <div className="space-y-4">
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
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Filtrlash
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  
                  {dateFilter === 'custom' && (
                    <div className="space-y-2">
                      <Label>Maxsus sana oralig'i</Label>
                      <div className="grid grid-cols-2 gap-2">
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
                </div>
                
                {dateFilter !== 'all' && (
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
            </Card>
          )}

          {orders.length > 0 && (
            <div className="flex justify-between items-center">
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
              <div className="space-y-3">
                {filteredOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleLoadOrder(order)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{order.name}</CardTitle>
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              {formatDate(order.createdAt)}
                            </div>
                            {order.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {order.phone}
                              </div>
                            )}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                          className="text-destructive hover:text-destructive"
                          disabled={deletingId === order.id}
                        >
                          {deletingId === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Material</p>
                          <p className="font-medium">{order.materials[order.state.selectedMaterial]?.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Mahsulotlar</p>
                          <p className="font-medium">{order.state.items.length} ta</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Xizmat</p>
                          <p className="font-medium">{order.services[order.state.selectedService]?.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-muted-foreground">Jami narx</p>
                          <p className="font-medium text-primary flex items-center">
                            {/* <DollarSign className="h-4 w-4 mr-1" /> */}
                            {formatCurrency(order.results.totalCost)}
                          </p>
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
    </Dialog>
  );
}

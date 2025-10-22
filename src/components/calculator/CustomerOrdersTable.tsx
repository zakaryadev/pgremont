import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
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
  Play
} from 'lucide-react';
import { CustomerOrder, useCustomerOrders } from '@/hooks/useCustomerOrders';
import { useToast } from '@/hooks/use-toast';
import { EditCustomerOrderModal } from './EditCustomerOrderModal';
import { PaymentRecordModal } from './PaymentRecordModal';
import { supabase } from '@/integrations/supabase/client';

interface CustomerOrdersTableProps {
  onEditOrder?: (order: CustomerOrder) => void;
}

export function CustomerOrdersTable({ onEditOrder }: CustomerOrdersTableProps) {
  const { orders, loading, error, deleteOrder, updateOrder, refreshOrders } = useCustomerOrders();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState<CustomerOrder | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(false);

  // Filter orders based on search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter(order => 
      order.customerName.toLowerCase().includes(query) ||
      order.phoneNumber?.toLowerCase().includes(query) ||
      order.paymentType.toLowerCase().includes(query)
    );
  }, [orders, searchQuery]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' so\'m';
  };

  const formatDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const time = date.toLocaleTimeString('uz-UZ', {
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${day}.${month}.${year}, ${time}`;
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case 'cash': return 'NAQD';
      case 'click': return 'CLICK';
      case 'transfer': return 'PERECHESLENIYA';
      default: return type;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    switch (type) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'click': return 'bg-blue-100 text-blue-800';
      case 'transfer': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleDeleteOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const confirmed = window.confirm(
      'Bu mijoz buyurtmasini o\'chirishni xohlaysizmi?\n\n' +
      'Bu amalni bekor qilib bo\'lmaydi!'
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
        variant: "destructive"
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
        variant: "destructive"
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

  const handleSavePaymentRecord = async (orderId: string, paymentRecords: any[]) => {
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
        variant: "destructive"
      });
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  // Auto refresh every 3 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      refreshOrders();
    }, 3000); // 3 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshOrders]);

  // Auto delete fully paid orders
  useEffect(() => {
    const checkAndDeleteFullyPaid = async () => {
      // Check orders that are fully paid (remaining balance <= 0)
      const fullyPaidOrders = orders.filter(order => {
        // Orders are fully paid when remaining balance is 0 or negative
        return order.remainingBalance <= 0;
      });
      
      if (fullyPaidOrders.length > 0) {
        for (const order of fullyPaidOrders) {
          try {
            // Show notification first
            toast({
              title: "To'liq to'langan buyurtma",
              description: `${order.customerName} - Buyurtma to'liq to'langan, o'chirilmoqda...`,
            });

            // Wait 2 seconds to show the notification
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Delete related payment records first
            const { error: deletePaymentError } = await supabase
              .from('payment_records')
              .delete()
              .eq('order_id', order.id);

            if (deletePaymentError) {
              throw deletePaymentError;
            }

            // Delete the order itself
            const { error: deleteOrderError } = await supabase
              .from('customer_orders')
              .delete()
              .eq('id', order.id);

            if (deleteOrderError) {
              throw deleteOrderError;
            }

            toast({
              title: "Buyurtma o'chirildi",
              description: `${order.customerName} - To'liq to'langan buyurtma muvaffaqiyatli o'chirildi`,
            });

          } catch (error) {
            console.error('Failed to delete fully paid order:', error);
            toast({
              title: "Xatolik",
              description: `${order.customerName} buyurtmasini o'chirishda xatolik yuz berdi`,
              variant: "destructive"
            });
          }
        }
        
        // Refresh orders after all deletions
        setTimeout(() => {
          refreshOrders();
        }, 1000);
      }
    };

    // Run check every 5 seconds
    const interval = setInterval(checkAndDeleteFullyPaid, 5000);
    
    return () => clearInterval(interval);
  }, [orders, refreshOrders, toast]);

  return (
    <div className="space-y-4">
      {/* Search and Stats */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Saqlangan mijoz buyurtmalari</CardTitle>
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
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Mijoz nomi, telefon yoki to'lov turi bo'yicha qidiring..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10 w-full sm:w-80"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
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
                  variant={autoRefreshEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAutoRefreshEnabled(!autoRefreshEnabled)}
                  className="flex items-center gap-2"
                  title={autoRefreshEnabled ? "Avtomatik yangilashni to'xtatish" : "Avtomatik yangilashni yoqish"}
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
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mijoz</TableHead>
                    <TableHead>Telefon</TableHead>
                    <TableHead>Jami summa</TableHead>
                    <TableHead>To'lov turi</TableHead>
                    <TableHead>Avans</TableHead>
                    <TableHead>Qoldiq</TableHead>
                    <TableHead>Sana</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => (
                    <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          {order.customerName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {order.phoneNumber ? (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.phoneNumber}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-semibold text-primary">
                        {formatCurrency(order.totalAmount)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getPaymentTypeColor(order.paymentType)}>
                          {getPaymentTypeLabel(order.paymentType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                            <span className="text-green-600 font-medium">To'liq to'langan</span>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(order.totalAmount)}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleViewOrder(order, e)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title="Ko'rish"
                          >
                            <Eye className="h-3 w-3" />
                          </Button> */}
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
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Mijoz buyurtmasi tafsilotlari</DialogTitle>
              <DialogDescription>
                {selectedOrder.customerName} - {formatDate(selectedOrder.createdAt)}
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
                  <p className="text-sm">{selectedOrder.phoneNumber || 'Kiritilmagan'}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Jami summa</Label>
                  <p className="text-sm font-semibold text-primary">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">To'lov turi</Label>
                  <Badge className={getPaymentTypeColor(selectedOrder.paymentType)}>
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

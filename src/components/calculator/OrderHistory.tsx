import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Trash2, Calendar, DollarSign, Package, Eye } from 'lucide-react';
import { Order } from '../../types/calculator';
import { useOrders } from '../../hooks/useOrders';

interface OrderHistoryProps {
  onLoadOrder?: (order: Order) => void;
}

export function OrderHistory({ onLoadOrder }: OrderHistoryProps) {
  const { orders, deleteOrder, clearAllOrders } = useOrders();
  const [isOpen, setIsOpen] = useState(false);

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

  const handleDeleteOrder = (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteOrder(orderId);
  };

  const handleLoadOrder = (order: Order) => {
    if (onLoadOrder) {
      onLoadOrder(order);
    }
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Eye className="h-4 w-4 mr-2" />
          Buyurtmalar tarixi
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Buyurtmalar tarixi</DialogTitle>
          <DialogDescription>
            Saqlangan barcha buyurtmalarni ko'ring va boshqaring
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {orders.length > 0 && (
            <div className="flex justify-between items-center">
              <Badge variant="secondary">
                Jami: {orders.length} ta buyurtma
              </Badge>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={clearAllOrders}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Barchasini o'chirish
              </Button>
            </div>
          )}

          <ScrollArea className="h-[400px]">
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Hali hech qanday buyurtma saqlanmagan</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <Card 
                    key={order.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleLoadOrder(order)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{order.name}</CardTitle>
                          <CardDescription className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {formatDate(order.createdAt)}
                          </CardDescription>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleDeleteOrder(order.id, e)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
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
                            <DollarSign className="h-4 w-4 mr-1" />
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

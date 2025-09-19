import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Package } from 'lucide-react';
import { Item } from '../../types/calculator';

interface ItemVisibilityToggleProps {
  items: Item[];
  onToggleVisibility: (itemId: string) => void;
}

export function ItemVisibilityToggle({ items, onToggleVisibility }: ItemVisibilityToggleProps) {
  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Mahsulotlarni boshqarish
          </CardTitle>
          <CardDescription>
            Qaysi mahsulotlarni hisob-kitobga qo'shishni belgilang
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Hozircha hech qanday mahsulot qo'shilmagan
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Mahsulotlarni boshqarish
        </CardTitle>
        <CardDescription>
          Qaysi mahsulotlarni hisob-kitobga qo'shishni belgilang
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, index) => (
          <div key={item.id} className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
            <div className="flex items-center space-x-3">
              {item.isVisible ? (
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
              <div className="space-y-1">
                <Label htmlFor={`item-${item.id}`} className="text-sm font-medium">
                  {item.name}
                </Label>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline">{item.width}m × {item.height}m</Badge>
                  <Badge variant="outline">{item.quantity} dona</Badge>
                </div>
              </div>
            </div>
            <Switch
              id={`item-${item.id}`}
              checked={item.isVisible}
              onCheckedChange={() => onToggleVisibility(item.id)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

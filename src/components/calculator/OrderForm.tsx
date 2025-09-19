import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, History } from 'lucide-react';

interface OrderFormProps {
  onSaveOrder: (name: string) => void;
  onShowHistory: () => void;
  disabled?: boolean;
}

export function OrderForm({ onSaveOrder, onShowHistory, disabled }: OrderFormProps) {
  const [orderName, setOrderName] = useState('');

  const handleSave = () => {
    if (orderName.trim()) {
      onSaveOrder(orderName.trim());
      setOrderName('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Buyurtmani saqlash
        </CardTitle>
        <CardDescription>
          Joriy hisob-kitobni nom bilan saqlang
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="order-name">Buyurtma nomi</Label>
          <Input
            id="order-name"
            placeholder="Masalan: Reklama banneri, Ofis yozuvlari..."
            value={orderName}
            onChange={(e) => setOrderName(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={!orderName.trim() || disabled}
            className="flex-1"
          >
            <Save className="h-4 w-4 mr-2" />
            Saqlash
          </Button>
          <Button 
            variant="outline" 
            onClick={onShowHistory}
            className="flex-1"
          >
            <History className="h-4 w-4 mr-2" />
            Tarix
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

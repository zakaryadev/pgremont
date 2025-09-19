import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface PriceListProps {
  materials: Record<string, { name: string; materialPrice: number; printPrice: number }>;
  services: Record<string, { name: string; price: number; type: string }>;
  onUpdateMaterialPrice: (materialKey: string, field: 'materialPrice' | 'printPrice', value: number) => void;
  onUpdateServicePrice: (serviceKey: string, value: number) => void;
}

export function PriceList({ 
  materials, 
  services, 
  onUpdateMaterialPrice, 
  onUpdateServicePrice 
}: PriceListProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">PRAYSLIST (Narxlar ro'yxati)</h2>
      
      <div className="space-y-4">
        {Object.entries(materials).map(([key, material]) => (
          <div key={key} className="flex justify-between items-center gap-4">
            <Label className="text-sm font-medium min-w-0 flex-1">
              {material.name} (m²):
            </Label>
            <div className="flex gap-2">
              <Input
                type="number"
                value={material.materialPrice}
                onChange={(e) => onUpdateMaterialPrice(key, 'materialPrice', parseFloat(e.target.value))}
                className="w-24 text-right"
                placeholder="Material"
              />
              <Input
                type="number"
                value={material.printPrice}
                onChange={(e) => onUpdateMaterialPrice(key, 'printPrice', parseFloat(e.target.value))}
                className="w-24 text-right"
                placeholder="Bosma"
              />
            </div>
          </div>
        ))}
        
        <Separator className="my-4" />
        
        {Object.entries(services).map(([key, service]) => {
          if (key === 'none') return null;
          return (
            <div key={key} className="flex justify-between items-center gap-4">
              <Label className="text-sm font-medium min-w-0 flex-1">
                {service.name} ({service.type === 'per_sqm' ? 'm² uchun' : 'dona uchun'}):
              </Label>
              <Input
                type="number"
                value={service.price}
                onChange={(e) => onUpdateServicePrice(key, parseFloat(e.target.value))}
                className="w-24 text-right"
              />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
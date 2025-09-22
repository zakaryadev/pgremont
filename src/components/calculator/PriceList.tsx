import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

interface PriceListProps {
  materials: Record<string, { name: string; price: number; wastePrice: number }>;
  onUpdateMaterialPrice: (materialKey: string, value: number) => void;
}

export function PriceList({ 
  materials, 
  onUpdateMaterialPrice
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
            <Input
              type="number"
              value={material.price}
              onChange={(e) => onUpdateMaterialPrice(key, parseFloat(e.target.value))}
              className="w-24 text-right"
              placeholder="Narx"
            />
          </div>
        ))}
        
      </div>
    </Card>
  );
}
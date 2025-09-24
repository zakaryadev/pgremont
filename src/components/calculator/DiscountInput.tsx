import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface DiscountInputProps {
  discountPercentage: number;
  onDiscountChange: (percentage: number) => void;
}

export function DiscountInput({ discountPercentage, onDiscountChange }: DiscountInputProps) {
  const handleDiscountChange = (value: string) => {
    const percentage = parseFloat(value) || 0;
    onDiscountChange(percentage);
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-card to-muted/20">
      <h3 className="text-lg font-semibold mb-3 text-foreground">Skidka</h3>
      <div className="space-y-2">
        <Label htmlFor="discount" className="text-sm font-medium text-muted-foreground">
          Skidka foizi (%)
        </Label>
        <Input
          id="discount"
          type="number"
          value={discountPercentage || ""}
          onChange={(e) => handleDiscountChange(e.target.value)}
          placeholder="Masalan: 10"
          min="0"
          max="100"
          step="0.1"
          className="mt-1"
        />
        <p className="text-xs text-muted-foreground">
          Skidka foizini kiriting (0-100% oralig'ida)
        </p>
      </div>
    </Card>
  );
}

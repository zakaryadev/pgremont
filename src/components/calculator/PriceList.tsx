import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";
import { useState, useEffect } from "react";

interface PriceListProps {
  materials: Record<string, { name: string; price: number; wastePrice: number }>;
  onUpdateMaterialPrice: (materialKey: string, value: number) => void;
  onUpdateMaterialWastePrice?: (materialKey: string, value: number) => void;
}

export function PriceList({ 
  materials, 
  onUpdateMaterialPrice,
  onUpdateMaterialWastePrice
}: PriceListProps) {
  // Local state to manage input values temporarily
  const [localPrices, setLocalPrices] = useState<Record<string, string>>({});

  // Initialize local prices when materials change
  useEffect(() => {
    const initialPrices: Record<string, string> = {};
    Object.entries(materials).forEach(([key, material]) => {
      initialPrices[key] = material.price.toString();
    });
    setLocalPrices(initialPrices);
  }, [materials]);

  // Handle input change (only update local state)
  const handleInputChange = (materialKey: string, value: string) => {
    console.log(`📝 PriceList: Input o'zgargan: ${materialKey} = ${value}`);
    setLocalPrices(prev => ({
      ...prev,
      [materialKey]: value
    }));
    
    // Auto-save when value is valid
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      console.log(`💾 PriceList: Auto-save: ${materialKey} = ${numValue}`);
      onUpdateMaterialPrice(materialKey, numValue);
    }
  };

  // Handle save when user finishes editing (onBlur or Enter key)
  const handleSave = (materialKey: string) => {
    const value = parseFloat(localPrices[materialKey]);
    console.log(`💾 PriceList: handleSave chaqirildi: ${materialKey} = ${value}`);
    if (!isNaN(value) && value >= 0) {
      console.log(`📞 PriceList: onUpdateMaterialPrice chaqirilmoqda: ${materialKey} = ${value}`);
      onUpdateMaterialPrice(materialKey, value);
    } else {
      console.log(`❌ PriceList: Noto'g'ri qiymat, qaytarilmoqda: ${value}`);
      // Reset to original value if invalid
      setLocalPrices(prev => ({
        ...prev,
        [materialKey]: materials[materialKey].price.toString()
      }));
    }
  };

  // Handle key press (Enter to save)
  const handleKeyPress = (e: React.KeyboardEvent, materialKey: string) => {
    if (e.key === 'Enter') {
      handleSave(materialKey);
      (e.target as HTMLInputElement).blur(); // Remove focus
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">PRAYSLIST (Narxlar ro'yxati)</h2>
      
      <div className="space-y-4">
        {Object.entries(materials).map(([key, material]) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-center gap-4">
              <Label className="text-sm font-medium min-w-0 flex-1">
                {material.name}:
              </Label>
              <Input
                type="number"
                value={localPrices[key] || material.price.toString()}
                onChange={(e) => handleInputChange(key, e.target.value)}
                onBlur={() => {
                  console.log(`👁️ PriceList: onBlur chaqirildi: ${key}`);
                  handleSave(key);
                }}
                onKeyPress={(e) => handleKeyPress(e, key)}
                className="w-24 text-right"
                placeholder="Narx"
              />
            </div>
          </div>
        ))}
        
      </div>
    </Card>
  );
}
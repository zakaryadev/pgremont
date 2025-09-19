import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { CalculationResults, Item } from "../../types/calculator";

interface ResultsProps {
  results: CalculationResults;
  items: Item[];
  materialPrice: number;
  materials: Record<string, { name: string; price: number }>;
}

export function Results({ results, items, materialPrice, materials }: ResultsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' so\'m';
  };

  const formatArea = (area: number) => {
    return area.toFixed(2) + ' m²';
  };

  // Get material price for specific item
  const getItemMaterialPrice = (item: Item) => {
    // Use the material price saved with the item
    return item.materialPrice;
  };

  // Calculate individual item details
  const getItemDetails = (item: Item, itemMaterialPrice: number) => {
    const printArea = item.width * item.height * item.quantity;
    const materialUsed = item.materialWidth * item.height * item.quantity;
    const waste = Math.abs(materialUsed - printArea);
    const wastePercentage = materialUsed > 0 ? (waste / materialUsed) * 100 : 0;
    const printCost = printArea * itemMaterialPrice;
    const wasteCost = waste * itemMaterialPrice;
    const totalCost = printCost + wasteCost;

    return {
      printArea,
      materialUsed,
      waste,
      wastePercentage,
      printCost,
      wasteCost,
      totalCost,
      materialPrice: itemMaterialPrice
    };
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
      <h2 className="text-xl font-semibold mb-4 text-foreground">UMUMIY HISOBOT</h2>
      
      <div className="space-y-3">
        {/* Individual item calculations */}
        {items.filter(item => item.isVisible).map((item, index) => {
          const itemMaterialPrice = getItemMaterialPrice(item);
          const details = getItemDetails(item, itemMaterialPrice);
          return (
            <div key={item.id} className="border rounded-lg p-3 bg-muted/20">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">{item.name}</span>
                <Badge variant="outline">{formatArea(details.totalCost / itemMaterialPrice)}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pechat:</span>
                  <span>{formatArea(details.printArea)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Material:</span>
                  <span>{formatArea(details.materialUsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-destructive">Chiqindi:</span>
                  <span className="text-destructive">{formatArea(details.waste)} ({details.wastePercentage.toFixed(1)}%)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Narx:</span>
                  <span className="font-medium">{formatCurrency(details.totalCost)}</span>
                </div>
              </div>
            </div>
          );
        })}

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Jami bosma maydoni:</span>
          <span className="font-semibold">{formatArea(results.totalPrintArea)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Jami material sarfi:</span>
          <span className="font-semibold">{formatArea(results.totalMaterialUsed)}</span>
        </div>
        
        {/* Material bo'yicha chiqindilar */}
        {(() => {
          const materialWasteMap = new Map();
          
          items.filter(item => item.isVisible).forEach(item => {
            const itemMaterialPrice = getItemMaterialPrice(item);
            const details = getItemDetails(item, itemMaterialPrice);
            const materialKey = `${item.name.split(' (')[0]} (${item.materialWidth}m)`;
            
            if (materialWasteMap.has(materialKey)) {
              const existing = materialWasteMap.get(materialKey);
              materialWasteMap.set(materialKey, {
                waste: existing.waste + details.waste,
                wasteCost: existing.wasteCost + details.wasteCost,
                materialPrice: itemMaterialPrice
              });
            } else {
              materialWasteMap.set(materialKey, {
                waste: details.waste,
                wasteCost: details.wasteCost,
                materialPrice: itemMaterialPrice
              });
            }
          });

          return Array.from(materialWasteMap.entries()).map(([materialName, data]) => (
            <div key={materialName} className="flex justify-between items-center">
              <span className="text-destructive font-medium">{materialName} chiqindisi:</span>
              <div className="text-right">
                <span className="font-semibold text-destructive">
                  {formatArea(data.waste)} - {formatCurrency(data.wasteCost)}
                </span>
              </div>
            </div>
          ));
        })()}

        <div className="flex justify-between items-center">
          <span className="text-destructive font-medium">Jami chiqindi (отход):</span>
          <div className="text-right">
            <span className="font-semibold text-destructive">
              {formatArea(results.totalWaste)}
            </span>
            <Badge variant="destructive" className="ml-2">
              {results.wastePercentage.toFixed(2)}%
            </Badge>
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Pechat material narxi:</span>
          <span className="font-semibold">{formatCurrency(results.materialCost)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-destructive font-medium">Chiqindi narxi:</span>
          <span className="font-semibold text-destructive">{formatCurrency(results.wasteCost)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Xizmat narxi:</span>
          <span className="font-semibold">{formatCurrency(results.serviceCost)}</span>
        </div>
        
        <Separator className="border-dashed my-4" />
        
        <div className="flex justify-between items-center text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          <span>JAMI NARX:</span>
          <span>{formatCurrency(results.totalCost)}</span>
        </div>
      </div>
    </Card>
  );
}
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { CalculationResults } from "../../types/calculator";

interface ResultsProps {
  results: CalculationResults;
}

export function Results({ results }: ResultsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount) + ' so\'m';
  };

  const formatArea = (area: number) => {
    return area.toFixed(2) + ' m²';
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-primary/5">
      <h2 className="text-xl font-semibold mb-4 text-foreground">UMUMIY HISOBOT</h2>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Jami bosma maydoni:</span>
          <span className="font-semibold">{formatArea(results.totalPrintArea)}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Jami material sarfi:</span>
          <span className="font-semibold">{formatArea(results.totalMaterialUsed)}</span>
        </div>
        
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
          <span className="text-muted-foreground">Material narxi:</span>
          <span className="font-semibold">{formatCurrency(results.materialCost)}</span>
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
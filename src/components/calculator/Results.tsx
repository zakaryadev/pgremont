import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { CalculationResults, Item } from "../../types/calculator";

interface ResultsProps {
  results: CalculationResults;
  items: Item[];
  materialPrice: number;
  materials: Record<string, { name: string; price: number; wastePrice: number }>;
  isTablet?: boolean; // Tablichka uchun flag
}

export function Results({ results, items, materialPrice, materials, isTablet = false }: ResultsProps) {
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

  // Get material waste price for specific item
  const getItemMaterialWastePrice = (item: Item) => {
    // Find material by name and get waste price
    // Try to match the full material name first, then fall back to partial matching
    let material = Object.values(materials).find(m => item.name.includes(m.name));
    if (!material) {
      // Fallback to partial matching for backward compatibility
      const materialName = item.name.split(' ')[0]; // Get material name from item name
      material = Object.values(materials).find(m => m.name.includes(materialName));
    }
    return material?.wastePrice || 0;
  };

  // Calculate individual item details
  const getItemDetails = (item: Item, itemMaterialPrice: number) => {
    // Mahsulot turini tekshirish
    const isBadge = item.name.toLowerCase().includes('beydjik');
    const isAcrylicLetters = item.name.toLowerCase().includes('akril');
    const isVolumetricLetters = item.name.toLowerCase().includes('обьемная буква') || item.name.toLowerCase().includes('volumetric');
    const isLetters = isAcrylicLetters || isVolumetricLetters || item.name.toLowerCase().includes('буква') || item.name.toLowerCase().includes('обьемная');
    const isLightBox = item.name.toLowerCase().includes('световой короб') || item.name.toLowerCase().includes('light box') || item.name.toLowerCase().includes('тканевые');
    const isStatuetka = item.name.toLowerCase().includes('statuetka');
    const isBolt = item.name.toLowerCase().includes('bolt');
    
    let printArea, materialUsed, printCost;
    
    if (isBadge) {
      // Beydjik uchun: soniga qarab hisoblash
      printArea = 0.07 * 0.04 * item.quantity; // 7x4 cm = 0.07x0.04 m
      materialUsed = printArea;
      printCost = item.quantity * itemMaterialPrice; // Soniga qarab narx
    } else if (isLightBox) {
      // Light box uchun: eni (m) × bo'yi (m) × soni × narx per m²
      // Light box va fabric box uchun chiqindi bo'lmaydi, chunki o'lcham ixtiyoriy
      printArea = item.width * item.height * item.quantity;
      materialUsed = printArea; // Chiqindi yo'q, chunki o'lcham ixtiyoriy
      printCost = printArea * itemMaterialPrice; // maydon × narx per m²
    } else if (isLetters) {
      // Harflar uchun: balandlik (cm) × harf soni × narx
      printArea = 0; // Maydon hisoblanmaydi
      materialUsed = 0; // Material sarfi hisoblanmaydi
      printCost = item.height * item.quantity * itemMaterialPrice; // balandlik (cm) × harf soni × narx
    } else if (isStatuetka) {
      // Statuetka uchun: faqat soni × narx (donasiga 200,000 so'm)
      printArea = 0; // Maydon hisoblanmaydi
      materialUsed = 0; // Material sarfi hisoblanmaydi
      printCost = item.quantity * itemMaterialPrice; // soni × narx
    } else if (isBolt) {
      // Bolt uchun: soni × narx
      printArea = 0; // Maydon hisoblanmaydi
      materialUsed = 0; // Material sarfi hisoblanmaydi
      printCost = item.quantity * itemMaterialPrice; // soni × narx
    } else {
      // Boshqa mahsulotlar uchun: maydon bo'yicha hisoblash
      printArea = item.width * item.height * item.quantity;
      materialUsed = item.materialWidth * item.height * item.quantity;
      printCost = printArea * itemMaterialPrice;
    }
    
    // Harflar kalkulyatori uchun chiqindi umuman hisoblanmaydi
    const waste = 0; // Harflar uchun chiqindi yo'q
    const wastePercentage = 0; // Harflar uchun chiqindi foizi yo'q
    const wastePrice = 0; // Harflar uchun chiqindi narxi yo'q
    const wasteCost = 0; // Harflar uchun chiqindi xarajati yo'q
    const totalCost = printCost; // Faqat asosiy narx

    return {
      printArea,
      materialUsed,
      waste,
      wastePercentage,
      printCost,
      wasteCost,
      totalCost,
      materialPrice: itemMaterialPrice,
      wastePrice: wastePrice,
      isBadge, // Beydjik ekanligini qaytarish
      isAcrylicLetters, // Akril harflar ekanligini qaytarish
      isVolumetricLetters, // Ob'emli harflar ekanligini qaytarish
      isLetters, // Harflar ekanligini qaytarish
      isLightBox, // Light box ekanligini qaytarish
      isStatuetka, // Statuetka ekanligini qaytarish
      isBolt // Bolt ekanligini qaytarish
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
          
          // Beydjik uchun alohida ko'rsatish
          if (details.isBadge) {
            return (
              <div key={item.id} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm text-blue-800">{item.name}</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {item.quantity} dona
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600">O'lcham:</span>
                    <span className="text-blue-800">7×4 cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Soni:</span>
                    <span className="text-blue-800">{item.quantity} dona</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Bitta narx:</span>
                    <span className="text-blue-800">{formatCurrency(itemMaterialPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Jami narx:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(details.totalCost)}</span>
                  </div>
                </div>
              </div>
            );
          }

          // Light box uchun alohida ko'rsatish
          if (details.isLightBox) {
            return (
              <div key={item.id} className="border rounded-lg p-3 bg-blue-50 border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm text-blue-800">{item.name}</span>
                  <Badge variant="outline" className="bg-blue-100 text-blue-800">
                    {item.quantity} dona
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Eni:</span>
                    <span className="text-blue-800">{item.width} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Bo'yi:</span>
                    <span className="text-blue-800">{item.height} m</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Maydon:</span>
                    <span className="text-blue-800">{(item.width * item.height).toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">1 m² narx:</span>
                    <span className="text-blue-800">{formatCurrency(itemMaterialPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600 font-medium">Jami narx:</span>
                    <span className="font-bold text-blue-900">{formatCurrency(details.totalCost)}</span>
                  </div>
                </div>
              </div>
            );
          }

          // Harflar uchun alohida ko'rsatish
          if (details.isAcrylicLetters || details.isVolumetricLetters || details.isLetters) {
            return (
              <div key={item.id} className="border rounded-lg p-3 bg-green-50 border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm text-green-800">{item.name}</span>
                  <Badge variant="outline" className="bg-green-100 text-green-800">
                    {item.quantity} harf
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-600">Balandlik:</span>
                    <span className="text-green-800">{item.height} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">Harf soni:</span>
                    <span className="text-green-800">{item.quantity} ta</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600">1 cm narx:</span>
                    <span className="text-green-800">{formatCurrency(itemMaterialPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-600 font-medium">Jami narx:</span>
                    <span className="font-bold text-green-900">{formatCurrency(details.totalCost)}</span>
                  </div>
                </div>
              </div>
            );
          }

          // Statuetka uchun alohida ko'rsatish
          if (details.isStatuetka) {
            return (
              <div key={item.id} className="border rounded-lg p-3 bg-purple-50 border-purple-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm text-purple-800">{item.name}</span>
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    {item.quantity} dona
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-purple-600">Soni:</span>
                    <span className="text-purple-800">{item.quantity} dona</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600">Bitta narx:</span>
                    <span className="text-purple-800">{formatCurrency(itemMaterialPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-purple-600 font-medium">Jami narx:</span>
                    <span className="font-bold text-purple-900">{formatCurrency(details.totalCost)}</span>
                  </div>
                </div>
              </div>
            );
          }

          // Bolt uchun alohida ko'rsatish
          if (details.isBolt) {
            return (
              <div key={item.id} className="border rounded-lg p-3 bg-orange-50 border-orange-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-sm text-orange-800">{item.name}</span>
                  <Badge variant="outline" className="bg-orange-100 text-orange-800">
                    {item.quantity} dona
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-orange-600">Soni:</span>
                    <span className="text-orange-800">{item.quantity} dona</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600">Bitta narx:</span>
                    <span className="text-orange-800">{formatCurrency(itemMaterialPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-600 font-medium">Jami narx:</span>
                    <span className="font-bold text-orange-900">{formatCurrency(details.totalCost)}</span>
                  </div>
                </div>
              </div>
            );
          }
          
          // Boshqa mahsulotlar uchun oddiy ko'rsatish
          return (
            <div key={item.id} className="border rounded-lg p-3 bg-muted/20">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-sm">{item.name}</span>
                <Badge variant="outline">{formatArea(details.printArea)}</Badge>
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
                {/* Harflar kalkulyatori uchun chiqindi ko'rsatilmaydi */}
                {!details.isLightBox && !details.isLetters && !details.isStatuetka && !details.isBolt && (
                  <div className="flex justify-between">
                    <span className="text-destructive">Chiqindi:</span>
                    <span className="text-destructive">{formatArea(details.waste)} ({details.wastePercentage.toFixed(1)}%)</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Narx:</span>
                  <span className="font-medium">{formatCurrency(details.totalCost)}</span>
                </div>
              </div>
            </div>
          );
        })}

        <Separator className="my-4" />

        {/* Harflar kalkulyatori uchun maydon ko'rsatilmaydi */}
        {!isTablet && (
          <>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Jami bosma maydoni:</span>
              <span className="font-semibold">{formatArea(results.totalPrintArea)}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Jami material sarfi:</span>
              <span className="font-semibold">{formatArea(results.totalMaterialUsed)}</span>
            </div>
          </>
        )}
        
        {/* Material bo'yicha chiqindilar - tablichkalar uchun ko'rsatilmaydi */}
        {!isTablet && (() => {
          const materialWasteMap = new Map();
          
          items.filter(item => item.isVisible).forEach(item => {
            const itemMaterialPrice = getItemMaterialPrice(item);
            const details = getItemDetails(item, itemMaterialPrice);
            // Try to match the full material name first, then fall back to partial matching
            let material = Object.values(materials).find(m => item.name.includes(m.name));
            if (!material) {
              // Fallback to partial matching for backward compatibility
              const materialName = item.name.split(' ')[0];
              material = Object.values(materials).find(m => m.name.includes(materialName));
            }
            const materialKey = `${material?.name || item.name.split(' ')[0]} (${item.materialWidth}m)`;
            
            if (materialWasteMap.has(materialKey)) {
              const existing = materialWasteMap.get(materialKey);
              materialWasteMap.set(materialKey, {
                waste: existing.waste + details.waste,
                wasteCost: existing.wasteCost + details.wasteCost,
                wastePrice: details.wastePrice
              });
            } else {
              materialWasteMap.set(materialKey, {
                waste: details.waste,
                wasteCost: details.wasteCost,
                wastePrice: details.wastePrice
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

        {/* Tablichkalar uchun jami chiqindi ko'rsatilmaydi */}
        {!isTablet && (
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
        )}
        
        <Separator className="my-4" />
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Pechat material narxi:</span>
          <span className="font-semibold">{formatCurrency(results.materialCost)}</span>
        </div>
        
        {/* Tablichkalar uchun chiqindi narxi ko'rsatilmaydi */}
        {!isTablet && (
          <div className="flex justify-between items-center">
            <span className="text-destructive font-medium">Chiqindi narxi:</span>
            <span className="font-semibold text-destructive">{formatCurrency(results.wasteCost)}</span>
          </div>
        )}
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Xizmat narxi:</span>
          <span className="font-semibold">{formatCurrency(results.serviceCost)}</span>
        </div>
        
        <Separator className="border-dashed my-4" />
        
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Jami narx:</span>
          <span className="font-semibold">{formatCurrency(results.totalCost)}</span>
        </div>
        
        {/* Skidka ko'rsatish */}
        {results.discountAmount > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-green-600 font-medium">Skidka:</span>
            <span className="font-semibold text-green-600">-{formatCurrency(results.discountAmount)}</span>
          </div>
        )}
        
        <Separator className="border-dashed my-4" />
        
        <div className="flex justify-between items-center text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
          <span>YAKUNIY NARX:</span>
          <span>{formatCurrency(results.finalCost)}</span>
        </div>
      </div>
    </Card>
  );
}
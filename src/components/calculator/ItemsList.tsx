import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Badge } from "../ui/badge";
import { Trash2, Eye, EyeOff } from "lucide-react";
import { Item, Service } from "../../types/calculator";

interface ItemsListProps {
  items: Item[];
  onDeleteItem: (index: number) => void;
  onToggleVisibility?: (itemId: string) => void;
  services?: Record<string, Service>;
  selectedMaterial?: string;
}

export function ItemsList({ items, onDeleteItem, onToggleVisibility, services, selectedMaterial }: ItemsListProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Qo'shilgan Ishlar Ro'yxati</h2>
      
      {items.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Hozircha ishlar qo'shilmagan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomi</TableHead>
                <TableHead>Holat</TableHead>
                <TableHead>Eni (m)</TableHead>
                <TableHead>Bo'yi (m)</TableHead>
                <TableHead>Soni</TableHead>
                <TableHead>Maydoni (m²)</TableHead>
                <TableHead>Xizmatlar</TableHead>
                <TableHead>Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const area = (item.width * item.height * item.quantity).toFixed(2);
                
                // Get service names
                const assemblyServiceName = item.assemblyService && services?.[item.assemblyService] 
                  ? services[item.assemblyService].name 
                  : null;
                const disassemblyServiceName = item.disassemblyService && services?.[item.disassemblyService] 
                  ? services[item.disassemblyService].name 
                  : null;
                
                return (
                  <TableRow key={item.id} className={`hover:bg-muted/50 ${!item.isVisible ? 'opacity-50' : ''}`}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.isVisible ? (
                          <Eye className="h-4 w-4 text-green-600" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        )}
                        <Badge variant={item.isVisible ? "default" : "secondary"}>
                          {item.isVisible ? "Ko'rinadi" : "Yashirin"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.width}</TableCell>
                    <TableCell>{item.height}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="font-semibold">{area}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {assemblyServiceName && (
                          <Badge variant="outline" className="text-xs">
                            Montaj: {assemblyServiceName}
                          </Badge>
                        )}
                        {disassemblyServiceName && (
                          <Badge variant="outline" className="text-xs">
                            Demontaj: {disassemblyServiceName}
                          </Badge>
                        )}
                        {!assemblyServiceName && !disassemblyServiceName && (
                          <span className="text-xs text-muted-foreground">Xizmat yo'q</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {onToggleVisibility && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onToggleVisibility(item.id)}
                            className="h-8 w-8 p-0"
                            title={item.isVisible ? "Yashirish" : "Ko'rsatish"}
                          >
                            {item.isVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        )}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => onDeleteItem(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Pechat narxlari haqida ma'lumot - faqat tegishli material tanlanganda ko'rinadi */}
      {(selectedMaterial === 'banner' || selectedMaterial === 'oracal') && (
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Pechat narxlari (m² uchun):</h3>
          
          {/* Banner uchun pechat narxlari */}
          {selectedMaterial === 'banner' && (
            <div className="mb-4">
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Баннер:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-red-800">До 3 м²</div>
                  <div className="text-red-600">50 000 сум/м²</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-red-800">4–15 м²</div>
                  <div className="text-red-600">35 000 сум/м²</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-red-800">16–40 м²</div>
                  <div className="text-red-600">30 000 сум/м²</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-red-800">41–100 м²</div>
                  <div className="text-red-600">25 000 сум/м²</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-red-800">101–300 м²</div>
                  <div className="text-red-600">22 000 сум/м²</div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-red-800">301–1000 м²</div>
                  <div className="text-red-600">20 000 сум/м²</div>
                </div>
              </div>
            </div>
          )}

          {/* Oracal uchun pechat narxlari */}
          {selectedMaterial === 'oracal' && (
            <div>
              <h4 className="text-xs font-medium text-muted-foreground mb-2">Оракал:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-blue-800">До 3 м²</div>
                  <div className="text-blue-600">50 000 сум/м²</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-blue-800">4–15 м²</div>
                  <div className="text-blue-600">40 000 сум/м²</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-blue-800">16–40 м²</div>
                  <div className="text-blue-600">35 000 сум/м²</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-blue-800">41–100 м²</div>
                  <div className="text-blue-600">30 000 сум/м²</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-blue-800">101–300 м²</div>
                  <div className="text-blue-600">28 000 сум/м²</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                  <div className="font-medium text-blue-800">301–1000 м²</div>
                  <div className="text-blue-600">27 000 сум/м²</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
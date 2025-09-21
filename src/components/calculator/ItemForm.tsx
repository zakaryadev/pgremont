import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Item } from "../../types/calculator";
import { useToast } from "../../hooks/use-toast";

interface ItemFormProps {
  selectedWidth: number;
  materialPrice: number;
  materialName: string;
  onAddItem: (item: Item) => void;
}

export function ItemForm({ selectedWidth, materialPrice, materialName, onAddItem }: ItemFormProps) {
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [assemblyService, setAssemblyService] = useState<string>("none");
  const [disassemblyService, setDisassemblyService] = useState<string>("none");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemWidth = parseFloat(width);
    const itemHeight = parseFloat(height);
    const itemQuantity = parseInt(quantity);

    if (isNaN(itemWidth) || isNaN(itemHeight) || isNaN(itemQuantity) || 
        itemWidth <= 0 || itemHeight <= 0 || itemQuantity <= 0) {
      toast({
        title: "Xato",
        description: "Iltimos, barcha maydonlarga to'g'ri qiymat kiriting.",
        variant: "destructive",
      });
      return;
    }

    if (itemWidth > selectedWidth) {
      toast({
        title: "Xato", 
        description: `Ishning eni (${itemWidth}m) tanlangan material enidan (${selectedWidth}m) katta bo'lishi mumkin emas.`,
        variant: "destructive",
      });
      return;
    }

    // Auto-generate product name based on material name and width
    const productName = `${materialName} ${selectedWidth}`;
    
    onAddItem({ 
      id: Date.now().toString(),
      name: productName,
      width: itemWidth, 
      height: itemHeight, 
      quantity: itemQuantity,
      isVisible: true,
      materialWidth: selectedWidth,
      materialPrice: materialPrice,
      assemblyService: assemblyService !== "none" ? assemblyService : undefined,
      disassemblyService: disassemblyService !== "none" ? disassemblyService : undefined
    });
    
    setWidth("");
    setHeight("");
    setQuantity("1");
    setAssemblyService("none");
    setDisassemblyService("none");
    
    toast({
      title: "Muvaffaqiyat",
      description: "Ish ro'yxatga qo'shildi.",
    });
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">3. Yangi ish qo'shish</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            Mahsulot nomi: <span className="font-medium text-foreground">{materialName} {selectedWidth}</span>
          </p>
        </div>
        <div>
          <Label htmlFor="item-width" className="text-sm font-medium text-muted-foreground">
            Ishning eni (m)
          </Label>
          <Input
            id="item-width"
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="Masalan: 1.5"
            step="0.01"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="item-height" className="text-sm font-medium text-muted-foreground">
            Ishning bo'yi (m)
          </Label>
          <Input
            id="item-height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="Masalan: 2.0"
            step="0.01"
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="item-quantity" className="text-sm font-medium text-muted-foreground">
            Soni (dona)
          </Label>
          <Input
            id="item-quantity"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            min="1"
            className="mt-1"
            required
          />
        </div>
        
        <div>
          <Label htmlFor="assembly-service" className="text-sm font-medium text-muted-foreground">
            Montaj xizmati (ixtiyoriy)
          </Label>
          <Select value={assemblyService} onValueChange={setAssemblyService}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Montaj xizmatini tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Montaj yo'q</SelectItem>
              <SelectItem value="install">Установка</SelectItem>
              <SelectItem value="install_rails">Установка с рейками</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label htmlFor="disassembly-service" className="text-sm font-medium text-muted-foreground">
            Demontaj xizmati (ixtiyoriy)
          </Label>
          <Select value={disassemblyService} onValueChange={setDisassemblyService}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Demontaj xizmatini tanlang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Demontaj yo'q</SelectItem>
              <SelectItem value="install_dismantle">Установка + Демонтаж</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button type="submit" className="w-full bg-primary hover:bg-primary-hover">
          Ro'yxatga qo'shish
        </Button>
      </form>
    </Card>
  );
}
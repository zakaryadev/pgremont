import { useState } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Item } from "../../types/calculator";
import { useToast } from "../../hooks/use-toast";

interface ItemFormProps {
  selectedWidth: number;
  materialPrice: number;
  materialName: string;
  selectedService: string;
  onAddItem: (item: Item) => void;
  isTablet?: boolean; // Tablitsalar uchun flag
}

export function ItemForm({ selectedWidth, materialPrice, materialName, selectedService, onAddItem, isTablet = false }: ItemFormProps) {
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [letterCount, setLetterCount] = useState<string>("1"); // Bukvalar uchun harf soni
  const [textInput, setTextInput] = useState<string>(""); // Matn kiritish uchun
  const { toast } = useToast();

  // Material turini aniqlash
  const isBadge = materialName.toLowerCase().includes('beydjik');
  const isAcrylicLetters = materialName.toLowerCase().includes('akril') && isTablet;
  const isVolumetricLetters = materialName.toLowerCase().includes('обьемная буква') || materialName.toLowerCase().includes('volumetric');
  const isLightBox = materialName.toLowerCase().includes('световой короб') || materialName.toLowerCase().includes('light box');
  const isTabletMaterial = materialName.toLowerCase().includes('tablichka') || materialName.toLowerCase().includes('romark') || materialName.toLowerCase().includes('orgsteklo');
  const isStatuetka = materialName.toLowerCase().includes('statuetka');
  const isBolt = materialName.toLowerCase().includes('bolt');
  
  // CM dan M ga aylantirish kerak bo'lgan tablichka materiallari
  const isCmToMTablet = materialName.toLowerCase().includes('romark tablichka') || 
                       materialName.toLowerCase().includes('akril (alyukabond) tablichka') || 
                       materialName.toLowerCase().includes('akril tablichka');

  // Matn kiritilganda harf sonini avtomatik hisoblash
  const handleTextChange = (text: string) => {
    setTextInput(text);
    // Bo'sh joylarni olib tashlash va harf sonini hisoblash
    const cleanText = text.replace(/\s/g, '');
    setLetterCount(cleanText.length.toString());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let itemWidth, itemHeight, itemQuantity;
    if (isBadge) {
      // Beydjik uchun standart o'lcham: 7x4 cm = 0.07x0.04 m
      itemWidth = 0.07;
      itemHeight = 0.04;
      itemQuantity = parseInt(quantity);
    } else if (isAcrylicLetters || isVolumetricLetters) {
      // Akril harflar va ob'emli harflar uchun: bo'yi (cm) × harf soni
      itemWidth = 0;
      itemHeight = parseFloat(height); // cm da saqlash, m ga aylantirmaslik
      itemQuantity = parseInt(letterCount); // harf soni
    } else if (isLightBox) {
      // Light box uchun: eni (m) × bo'yi (m) × soni
      itemWidth = parseFloat(width);
      itemHeight = parseFloat(height);
      itemQuantity = parseInt(quantity);
    } else if (isTabletMaterial) {
      // Tablichkalar uchun: eni va bo'yi
      if (isCmToMTablet) {
        // CM dan M ga aylantirish: CM ÷ 100 = M
        itemWidth = parseFloat(width) / 100;
        itemHeight = parseFloat(height) / 100;
      } else {
        // Boshqa tablichkalar uchun: eni va bo'yi (m)
        itemWidth = parseFloat(width);
        itemHeight = parseFloat(height);
      }
      itemQuantity = parseInt(quantity);
    } else if (isStatuetka) {
      // Statuetka uchun: faqat soni × narx (donasiga 200,000 so'm)
      itemWidth = 0;
      itemHeight = 0;
      itemQuantity = parseInt(quantity);
    } else if (isBolt) {
      // Bolt uchun: soni × narx
      itemWidth = 0;
      itemHeight = 0;
      itemQuantity = parseInt(quantity);
    } else {
      // Boshqa mahsulotlar uchun: eni va bo'yi (m)
      itemWidth = parseFloat(width);
      itemHeight = parseFloat(height);
      itemQuantity = parseInt(quantity);
    }

    if (isNaN(itemQuantity) || itemQuantity <= 0) {
      toast({
        title: "Xato",
        description: (isAcrylicLetters || isVolumetricLetters) ? "Iltimos, harf sonini to'g'ri kiriting." : "Iltimos, miqdorni to'g'ri kiriting.",
        variant: "destructive",
      });
      return;
    }

    // Beydjik, bolt va statuetka bo'lmagan materiallar uchun o'lcham tekshiruvi
    if (!isBadge && !isBolt && !isStatuetka && (isNaN(itemHeight) || itemHeight <= 0)) {
      toast({
        title: "Xato",
        description: (isAcrylicLetters || isVolumetricLetters) ? "Iltimos, harfning bo'yi maydoniga to'g'ri qiymat kiriting." : "Iltimos, bo'yi maydoniga to'g'ri qiymat kiriting.",
        variant: "destructive",
      });
      return;
    }

    // Tablichkalar va light box uchun eni tekshiruvi
    if (!isBadge && !isAcrylicLetters && !isVolumetricLetters && !isBolt && !isStatuetka && (isNaN(itemWidth) || itemWidth <= 0)) {
      toast({
        title: "Xato",
        description: "Iltimos, eni maydoniga to'g'ri qiymat kiriting.",
        variant: "destructive",
      });
      return;
    }

    // Tablichkalar uchun material eni tekshiruvi yo'q - hohlagancha o'lcham

    // Auto-generate product name based on material name
    // For banners, use material name + material width
    const isBanner = materialName.toLowerCase().includes('баннер') || materialName.toLowerCase().includes('banner');
    const productName = isBanner ? `${materialName} ${selectedWidth}м` : (isTablet || isAcrylicLetters ? materialName : materialName);
    
    onAddItem({ 
      id: Date.now().toString(),
      name: productName,
      width: itemWidth, 
      height: itemHeight, 
      quantity: itemQuantity,
      isVisible: true,
      materialWidth: selectedWidth,
      materialPrice: materialPrice,
      assemblyService: selectedService !== "none" ? selectedService : undefined
    });
    
    if (!isBadge) {
      if (!isAcrylicLetters && !isVolumetricLetters && !isBolt && !isStatuetka) {
        setWidth("");
      }
      if (!isBolt && !isStatuetka) {
        setHeight("");
      }
    }
    if (!isAcrylicLetters && !isVolumetricLetters) {
      setQuantity("1");
    }
    setLetterCount("1");
    setTextInput(""); // Matn maydonini tozalash
    
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
            Mahsulot nomi: <span className="font-medium text-foreground">
              {materialName}
            </span>
          </p>
        </div>
        {/* Beydjik uchun o'lcham maydonlari ko'rsatilmaydi */}
        {!isBadge && (
          <>
            {/* Eni maydoni - boltlar, statuetka va harflar uchun ko'rsatilmaydi */}
            {!isBolt && !isStatuetka && !isAcrylicLetters && !isVolumetricLetters && (
              <div>
                <Label htmlFor="item-width" className="text-sm font-medium text-muted-foreground">
                  Ishning eni {isCmToMTablet ? "(cm)" : "(m)"}
                </Label>
                <Input
                  id="item-width"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  placeholder={isCmToMTablet ? "Masalan: 150" : "Masalan: 1.5"}
                  step="0.01"
                  className="mt-1"
                  required
                />
              </div>
            )}
            {/* Bo'yi maydoni - statuetka va bolt uchun ko'rsatilmaydi */}
            {!isStatuetka && !isBolt && (
              <div>
                <Label htmlFor="item-height" className="text-sm font-medium text-muted-foreground">
                  {(isAcrylicLetters || isVolumetricLetters) ? "Harfning bo'yi (cm)" : `Ishning bo'yi ${isCmToMTablet ? "(cm)" : "(m)"}`}
                </Label>
                <Input
                  id="item-height"
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder={(isAcrylicLetters || isVolumetricLetters) ? "Masalan: 50" : (isCmToMTablet ? "Masalan: 200" : "Masalan: 2.0")}
                  step={(isAcrylicLetters || isVolumetricLetters) ? "1" : "0.01"}
                  className="mt-1"
                  required
                />
              </div>
            )}
          </>
        )}
        
        {/* Beydjik uchun standart o'lcham ko'rsatish */}
        {materialName.toLowerCase().includes('beydjik') && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800 font-medium">
              📏 Standart o'lcham: 7×4 cm
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Beydjik uchun o'lcham kiritish shart emas
            </p>
          </div>
        )}
        
          {/* Akril harflar va ob'emli harflar uchun matn kiritish */}
          {(isAcrylicLetters || isVolumetricLetters) && (
            <div>
              <Label htmlFor="item-text" className="text-sm font-medium text-muted-foreground">
                Matn kiritish (ixtiyoriy)
              </Label>
              <Input
                id="item-text"
                type="text"
                value={textInput}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Masalan: MARKET"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Matn kiritilsa, harf soni avtomatik hisoblanadi
              </p>
            </div>
          )}

          {/* Akril harflar va ob'emli harflar uchun harf soni */}
          {(isAcrylicLetters || isVolumetricLetters) && (
            <div>
              <Label htmlFor="item-letter-count" className="text-sm font-medium text-muted-foreground">
                Harf soni
              </Label>
              <Input
                id="item-letter-count"
                type="number"
                value={letterCount}
                onChange={(e) => setLetterCount(e.target.value)}
                placeholder="Masalan: 5"
                min="1"
                className="mt-1"
                required
              />
            </div>
          )}

          {/* Boshqa mahsulotlar uchun soni */}
          {!isAcrylicLetters && !isVolumetricLetters && (
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
          )}
        
        <Button type="submit" className="w-full bg-primary hover:bg-primary-hover">
          Ro'yxatga qo'shish
        </Button>
      </form>
    </Card>
  );
}
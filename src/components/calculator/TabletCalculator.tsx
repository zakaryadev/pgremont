import { useState, useMemo } from "react";
import { MaterialSelector } from "./MaterialSelector";
import { WidthSelector } from "./WidthSelector";
import { ItemForm } from "./ItemForm";
import { ServiceSelector } from "./ServiceSelector";
import { ItemsList } from "./ItemsList";
import { PriceList } from "./PriceList";
import { Results } from "./Results";
import { OrderForm } from "./OrderForm";
import { OrderHistory } from "./OrderHistory";
import { ServiceVisibilityToggle } from "./ServiceVisibilityToggle";
import { ItemVisibilityToggle } from "./ItemVisibilityToggle";
import { DiscountInput } from "./DiscountInput";
import { tableMaterials as initialMaterials, tableServices as initialServices } from "../../data/tableData";
import { CalculatorState, Item, CalculationResults, Material, Service, ServiceVisibility, Order } from "../../types/calculator";
import { useOrders } from "../../hooks/useOrders";
import { useToast } from "../../hooks/use-toast";

export function TabletCalculator() {
  const [materials, setMaterials] = useState(initialMaterials);
  const [services, setServices] = useState(initialServices);
  const [serviceVisibility, setServiceVisibility] = useState<ServiceVisibility>({});
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [state, setState] = useState<CalculatorState>({
    items: [],
    selectedMaterial: 'romark',
    selectedWidth: 0, // Tablitsalar uchun eni kerak
    selectedService: 'none',
    discountPercentage: 0,
  });

  const { saveOrder, refreshOrders } = useOrders();
  const { toast } = useToast();

  const currentMaterial = materials[state.selectedMaterial];

  const selectMaterial = (materialKey: string) => {
    setState(prev => ({
      ...prev,
      selectedMaterial: materialKey,
      selectedWidth: 0, // Tablichkalar uchun material eni yo'q
      selectedService: 'none', // Reset service when material changes
    }));
  };

  const selectService = (serviceKey: string) => {
    setState(prev => ({
      ...prev,
      selectedService: serviceKey,
    }));
  };

  const addItem = (item: Item) => {
    setState(prev => ({
      ...prev,
      items: [...prev.items, item],
    }));
  };

  const deleteItem = (index: number) => {
    setState(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const updateMaterialPrice = (materialKey: string, value: number) => {
    if (isNaN(value)) return;
    setMaterials(prev => ({
      ...prev,
      [materialKey]: {
        ...prev[materialKey],
        price: value,
      }
    }));
  };

  const updateMaterialWastePrice = (materialKey: string, value: number) => {
    if (isNaN(value)) return;
    setMaterials(prev => ({
      ...prev,
      [materialKey]: {
        ...prev[materialKey],
        wastePrice: value,
      }
    }));
  };

  const updateServicePrice = (serviceKey: string, value: number) => {
    if (isNaN(value)) return;
    setServices(prev => ({
      ...prev,
      [serviceKey]: {
        ...prev[serviceKey],
        price: value,
      }
    }));
  };

  const toggleServiceVisibility = (serviceKey: string) => {
    setServiceVisibility(prev => ({
      ...prev,
      [serviceKey]: !prev[serviceKey]
    }));
  };

  const toggleItemVisibility = (itemId: string) => {
    setState(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId
          ? { ...item, isVisible: !item.isVisible }
          : item
      )
    }));
  };

  const handleSaveOrder = async (orderData: { name: string; phone?: string }) => {
    try {
      await saveOrder(orderData.name, state, results, materials, services, orderData.phone);
      // Trigger refresh in OrderHistory component
      setRefreshTrigger(prev => prev + 1);
      toast({
        title: "Buyurtma saqlandi",
        description: `"${orderData.name}" nomli buyurtma muvaffaqiyatli saqlandi`,
      });
    } catch (error) {
      toast({
        title: "Xatolik",
        description: "Buyurtmani saqlashda xatolik yuz berdi",
        variant: "destructive",
      });
    }
  };

  const handleLoadOrder = (order: Order) => {
    setState(order.state);
    setMaterials(order.materials);
    setServices(order.services);
    toast({
      title: "Buyurtma yuklandi",
      description: `"${order.name}" nomli buyurtma yuklandi`,
    });
  };

  const handleDiscountChange = (percentage: number) => {
    setState(prev => ({
      ...prev,
      discountPercentage: percentage,
    }));
  };

  const results = useMemo((): CalculationResults => {
    let totalPrintArea = 0;
    let totalMaterialUsed = 0;
    let totalServiceCost = 0;
    let totalMaterialCost = 0;
    let totalWasteCost = 0;

    // Only calculate for visible items
    state.items.filter(item => item.isVisible).forEach(item => {
      // Mahsulot turini tekshirish
      const isBadge = item.name.toLowerCase().includes('beydjik');
      const isStatuetka = item.name.toLowerCase().includes('statuetka');
      const isBolt = item.name.toLowerCase().includes('bolt');

      let itemPrintArea, itemMaterialUsed, itemMaterialCost;

      if (isBadge) {
        // Beydjik uchun: narx soniga qarab hisoblanadi
        itemPrintArea = 0.07 * 0.04 * item.quantity; // 7x4 cm = 0.07x0.04 m
        itemMaterialUsed = itemPrintArea;
        itemMaterialCost = item.quantity * item.materialPrice; // Soniga qarab narx
      } else if (isStatuetka) {
        // Statuetka uchun: faqat soni × narx (donasiga 200,000 so'm)
        itemPrintArea = 0; // Maydon hisoblanmaydi
        itemMaterialUsed = 0; // Material sarfi hisoblanmaydi
        itemMaterialCost = item.quantity * item.materialPrice; // soni × narx
      } else if (isBolt) {
        // Bolt uchun: soni × narx
        itemPrintArea = 0; // Maydon hisoblanmaydi
        itemMaterialUsed = 0; // Material sarfi hisoblanmaydi
        itemMaterialCost = item.quantity * item.materialPrice; // soni × narx
      } else {
        // Boshqa tablichkalar uchun: maydon bo'yicha hisoblash
        itemPrintArea = item.width * item.height * item.quantity;
        itemMaterialUsed = itemPrintArea;
        itemMaterialCost = itemPrintArea * item.materialPrice;
      }

      totalPrintArea += itemPrintArea;
      totalMaterialUsed += itemMaterialUsed;
      totalMaterialCost += itemMaterialCost;

      // Tablichkalar uchun chiqindi yo'q
      // totalWasteCost = 0; // Chiqindi hisoblanmaydi

      // Calculate service cost for this specific item
      let itemServiceCost = 0;

      // Assembly service cost
      if (item.assemblyService && item.assemblyService !== 'none') {
        const assemblyService = services[item.assemblyService];
        if (assemblyService) {
          if (assemblyService.type === 'per_sqm') {
            itemServiceCost += itemPrintArea * assemblyService.price;
          } else {
            itemServiceCost += assemblyService.price;
          }
        }
      }

      // Disassembly service cost
      if (item.disassemblyService && item.disassemblyService !== 'none') {
        const disassemblyService = services[item.disassemblyService];
        if (disassemblyService) {
          if (disassemblyService.type === 'per_sqm') {
            itemServiceCost += itemPrintArea * disassemblyService.price;
          } else {
            itemServiceCost += disassemblyService.price;
          }
        }
      }

      totalServiceCost += itemServiceCost;
    });

    // Tablichkalar uchun chiqindi yo'q
    const totalWaste = 0;
    const wastePercentage = 0;

    const printCost = 0;
    const totalCost = totalMaterialCost + printCost + totalServiceCost; // Chiqindi narxi qo'shilmaydi

    // Calculate discount
    const discountAmount = (totalCost * state.discountPercentage) / 100;
    const finalCost = totalCost - discountAmount;

    return {
      totalPrintArea,
      totalMaterialUsed,
      totalWaste: 0, // Tablichkalar uchun chiqindi yo'q
      wastePercentage: 0, // Tablichkalar uchun chiqindi foizi yo'q
      materialCost: totalMaterialCost,
      printCost,
      wasteCost: 0, // Tablichkalar uchun chiqindi narxi yo'q
      serviceCost: totalServiceCost,
      totalCost,
      discountAmount,
      finalCost,
    };
  }, [state, currentMaterial, services]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <a href="/">
              <img
                src="/logo.png"
                alt="TOGO GROUP Logo"
                className="h-16 md:h-20 w-auto mb-4"
              />
            </a>
            <h1 className="text-3xl font-bold mb-2">Tablichkalar kalkulyatori</h1>
            <p className="text-lg text-muted-foreground">
              Romark, orgsteklo, akril tablichkalar, beydjik, statuetka va boltlar uchun to'liq hisob-kitob
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Column: Input Forms and Prices */}

          <div className="xl:col-span-1 space-y-6">
            <MaterialSelector
              materials={materials}
              selectedMaterial={state.selectedMaterial}
              onSelect={selectMaterial}
            />

            {/* Tablichkalar uchun material eni tanlash yo'q */}

            <DiscountInput
              discountPercentage={state.discountPercentage}
              onDiscountChange={handleDiscountChange}
            />

            <OrderForm
              onSaveOrder={handleSaveOrder}
              onShowHistory={() => setShowOrderHistory(true)}
              disabled={state.items.length === 0}
            />
          </div>
          <div className="xl:col-span-1 space-y-6">
            <ItemForm
              selectedWidth={0} // Tablichkalar uchun material eni yo'q
              materialPrice={currentMaterial.price}
              materialName={currentMaterial.name}
              selectedService={state.selectedService}
              onAddItem={addItem}
              isTablet={false} // Tablichkalar uchun eni va balandlik kerak
            />

            <ServiceSelector
              services={services}
              selectedService={state.selectedService}
              selectedMaterial={state.selectedMaterial}
              onSelect={selectService}
            />
          </div>
          {/* Right Column: Lists and Results */}
          <div className="xl:col-span-2 space-y-6">
            <ItemsList
              items={state.items}
              onDeleteItem={deleteItem}
              onToggleVisibility={toggleItemVisibility}
              services={services}
              selectedMaterial={state.selectedMaterial}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceList
                materials={materials}
                onUpdateMaterialPrice={updateMaterialPrice}
              />

              <Results
                results={results}
                items={state.items}
                materialPrice={currentMaterial.price}
                materials={materials}
                isTablet={false} // Tablichkalar uchun eni va balandlik kerak
              />
            </div>

            <OrderHistory
              onLoadOrder={handleLoadOrder}
              isOpen={showOrderHistory}
              onClose={() => setShowOrderHistory(false)}
              refreshTrigger={refreshTrigger}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

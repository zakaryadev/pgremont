import { useState, useMemo, useEffect } from "react";
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
import { useCalculatorPersistence } from "../../hooks/useCalculatorPersistence";
import { Link } from "react-router-dom";

export function TabletCalculator() {
  
  const [serviceVisibility, setServiceVisibility] = useState<ServiceVisibility>({});
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const { saveOrder, refreshOrders } = useOrders();
  const { toast } = useToast();
  
  // Use persistent storage for calculator data
  const {
    data,
    updateState,
    updateMaterials,
    updateServices,
    updateMaterialPrice,
    updateMaterialWastePrice,
    updateServicePrice,
  } = useCalculatorPersistence('tablets');

  // Initialize with saved data or defaults
  const [materials, setMaterials] = useState(initialMaterials);
  const [services, setServices] = useState(initialServices);
  const [state, setState] = useState<CalculatorState>(data.state);

  // Update local state when persistent data changes (only on initial load)
  useEffect(() => {
    // Only update if current state is empty (initial load)
    if (state.items.length === 0 && Object.keys(materials).length === 0 && Object.keys(services).length === 0) {
      setState(data.state);
      setMaterials(data.materials && Object.keys(data.materials).length > 0 ? data.materials : initialMaterials);
      setServices(data.services && Object.keys(data.services).length > 0 ? data.services : initialServices);
    }
  }, [data]);


  const currentMaterial = materials[state.selectedMaterial];

  const selectMaterial = (materialKey: string) => {
    const newState = {
      ...state,
      selectedMaterial: materialKey,
      selectedWidth: 0, // Tablichkalar uchun material eni yo'q
      selectedService: 'none', // Reset service when material changes
    };
    setState(newState);
    updateState(newState);
  };

  const selectService = (serviceKey: string) => {
    const newState = {
      ...state,
      selectedService: serviceKey,
    };
    setState(newState);
    updateState(newState);
  };

  const addItem = (item: Item) => {
    const newState = {
      ...state,
      items: [...state.items, item],
    };
    setState(newState);
    updateState(newState);
  };

  const deleteItem = (index: number) => {
    const newState = {
      ...state,
      items: state.items.filter((_, i) => i !== index),
    };
    setState(newState);
    updateState(newState);
  };

  const handleUpdateMaterialPrice = (materialKey: string, value: number) => {
    if (isNaN(value)) return;
    const newMaterials = {
      ...materials,
      [materialKey]: {
        ...materials[materialKey],
        price: value,
      }
    };
    
    // Update material price in existing items that use this material
    const updatedItems = state.items.map(item => {
      // If this item uses the updated material, update its materialPrice
      if (item.name.includes(materials[materialKey].name.split(' ')[0])) {
        return {
          ...item,
          materialPrice: value
        };
      }
      return item;
    });
    
    const newState = {
      ...state,
      items: updatedItems
    };
    
    setMaterials(newMaterials);
    setState(newState);
    updateMaterials(newMaterials);
    updateState(newState);
  };

  const handleUpdateMaterialWastePrice = (materialKey: string, value: number) => {
    if (isNaN(value)) return;
    const newMaterials = {
      ...materials,
      [materialKey]: {
        ...materials[materialKey],
        wastePrice: value,
      }
    };
    setMaterials(newMaterials);
    updateMaterials(newMaterials);
  };

  const handleUpdateServicePrice = (serviceKey: string, value: number) => {
    if (isNaN(value)) return;
    const newServices = {
      ...services,
      [serviceKey]: {
        ...services[serviceKey],
        price: value,
      }
    };
    setServices(newServices);
    updateServices(newServices);
  };

  const toggleServiceVisibility = (serviceKey: string) => {
    setServiceVisibility(prev => ({
      ...prev,
      [serviceKey]: !prev[serviceKey]
    }));
  };

  const toggleItemVisibility = (itemId: string) => {
    const newState = {
      ...state,
      items: state.items.map(item =>
        item.id === itemId
          ? { ...item, isVisible: !item.isVisible }
          : item
      )
    };
    setState(newState);
    updateState(newState);
  };

  const handleSaveOrder = async (orderData: { name: string; phone?: string }) => {
    try {
      await saveOrder(orderData.name, state, results, materials, services, orderData.phone, 'tablets');
      
      // Clear the form after successful save
      const defaultState = {
        items: [],
        selectedMaterial: 'romark',
        selectedWidth: 0,
        selectedService: 'none',
        discountPercentage: 0,
      };
      setState(defaultState);
      updateState(defaultState);
      
      // Trigger refresh in OrderHistory component
      setRefreshTrigger(prev => prev + 1);
      toast({
        title: "Buyurtma saqlandi",
        description: `"${orderData.name}" nomli buyurtma muvaffaqiyatli saqlandi va forma tozalandi`,
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
    // Ensure items exist and have proper structure
    if (!order.state.items || !Array.isArray(order.state.items)) {
      toast({
        title: "Xatolik",
        description: "Buyurtma ma'lumotlari buzilgan",
        variant: "destructive",
      });
      return;
    }

    // Force state update with a new object to ensure React detects the change
    const newState = { ...order.state };
    const newMaterials = { ...order.materials };
    const newServices = { ...order.services };

    // Update state
    setState(newState);
    setMaterials(newMaterials);
    setServices(newServices);
    
    // Update persistent storage
    updateState(newState);
    updateMaterials(newMaterials);
    updateServices(newServices);
    
    console.log('\n✅ State muvaffaqiyatli yangilandi!');
    console.log('='.repeat(50));
    
    toast({
      title: "Buyurtma yuklandi",
      description: `"${order.name}" nomli buyurtma yuklandi`,
    });
  };

  const handleDiscountChange = (percentage: number) => {
    const newState = {
      ...state,
      discountPercentage: percentage,
    };
    setState(newState);
    updateState(newState);
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

      // Use the material price saved with this specific item
      const itemMaterialPrice = item.materialPrice;
      
      if (isBadge) {
        // Beydjik uchun: narx soniga qarab hisoblanadi
        itemPrintArea = 0.07 * 0.04 * item.quantity; // 7x4 cm = 0.07x0.04 m
        itemMaterialUsed = itemPrintArea;
        itemMaterialCost = item.quantity * itemMaterialPrice; // Soniga qarab narx
      } else if (isStatuetka) {
        // Statuetka uchun: faqat soni × narx (donasiga 200,000 so'm)
        itemPrintArea = 0; // Maydon hisoblanmaydi
        itemMaterialUsed = 0; // Material sarfi hisoblanmaydi
        itemMaterialCost = item.quantity * itemMaterialPrice; // soni × narx
      } else if (isBolt) {
        // Bolt uchun: soni × narx
        itemPrintArea = 0; // Maydon hisoblanmaydi
        itemMaterialUsed = 0; // Material sarfi hisoblanmaydi
        itemMaterialCost = item.quantity * itemMaterialPrice; // soni × narx
      } else {
        // Boshqa tablichkalar uchun: maydon bo'yicha hisoblash
        itemPrintArea = item.width * item.height * item.quantity;
        itemMaterialUsed = itemPrintArea;
        itemMaterialCost = itemPrintArea * itemMaterialPrice;
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
  }, [state, materials, services]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex flex-col items-center mb-4">
            <Link to="/">
              <img
                src="/logo.png"
                alt="TOGO GROUP Logo"
                className="h-16 md:h-20 w-auto mb-4"
              />
            </Link>
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
                onUpdateMaterialPrice={handleUpdateMaterialPrice}
                onUpdateMaterialWastePrice={handleUpdateMaterialWastePrice}
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
              calculatorType="tablets"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

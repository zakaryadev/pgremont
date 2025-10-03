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
import { materials as initialMaterials, services as initialServices } from "../../data/calculatorData";
import { CalculatorState, Item, CalculationResults, Material, Service, ServiceVisibility, Order } from "../../types/calculator";
import { useOrders } from "../../hooks/useOrders";
import { useToast } from "../../hooks/use-toast";
import { useCalculatorPersistence } from "../../hooks/useCalculatorPersistence";
import { Link } from "react-router-dom";

export function PolygraphyCalculator() {

  // const [serviceVisibility, setServiceVisibility] = useState<ServiceVisibility>({});
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const { saveOrder } = useOrders();
  const { toast } = useToast();

  // Use persistent storage for calculator data
  const {
    data,
    updateState,
    updateMaterials,
    updateServices,
    // updateMaterialPrice,
    // updateMaterialWastePrice,
    // updateServicePrice,
  } = useCalculatorPersistence('polygraphy');

  // Initialize with saved data or defaults
  const [materials, setMaterials] = useState(initialMaterials);
  const [services, setServices] = useState(initialServices);
  const [state, setState] = useState<CalculatorState>(data.state);

  // Update local state when persistent data changes
  useEffect(() => {
    console.log(`🔄 PolygraphyCalculator: data o'zgargan, yangilanmoqda...`);
    console.log(`📊 data.materials:`, data.materials);
    console.log(`📊 current materials:`, materials);
    
    // Always update materials when data.materials changes
    if (data.materials && Object.keys(data.materials).length > 0) {
      setMaterials(data.materials);
    }
    
    // Always update services when data.services changes
    if (data.services && Object.keys(data.services).length > 0) {
      setServices(data.services);
    }
    
    // Update state if it has items
    if (data.state.items.length > 0) {
      console.log(`📝 State yangilanmoqda:`, data.state);
      setState(data.state);
    }
  }, [data]);



  const currentMaterial = materials[state.selectedMaterial];

  const selectMaterial = (materialKey: string) => {
    const material = materials[materialKey];
    const newState = {
      ...state,
      selectedMaterial: materialKey,
      selectedWidth: material.widths[0], // Auto-select first width
      selectedService: 'none', // Reset service when material changes
    };
    setState(newState);
    updateState(newState);
  };

  const selectWidth = (width: number) => {
    const newState = {
      ...state,
      selectedWidth: width,
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
    console.log(`🔄 Material narxi yangilanmoqda: ${materialKey} = ${value}`);
    
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
      // Try to match the full material name first, then fall back to partial matching
      const materialName = materials[materialKey].name;
      const materialNameFirstWord = materialName.split(' ')[0];
      
      console.log(`🔍 Tekshirilmoqda: item="${item.name}", material="${materialName}", firstWord="${materialNameFirstWord}"`);
      
      if (item.name.includes(materialName) || item.name.includes(materialNameFirstWord)) {
        console.log(`📝 Item yangilanmoqda: ${item.name}, eski narx: ${item.materialPrice}, yangi narx: ${value}`);
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
    
    console.log(`💾 Yangi state saqlanmoqda:`, newState);
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
      await saveOrder(orderData.name, state, results, materials, services, orderData.phone, 'polygraphy');

      // Clear the form after successful save
      const defaultState = {
        items: [],
        selectedMaterial: 'banner',
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
    console.log(`📥 Buyurtma yuklanmoqda:`, order);
    
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

    console.log(`📝 Yangi state:`, newState);
    console.log(`📝 Yangi materials:`, newMaterials);
    console.log(`📝 Yangi services:`, newServices);

    // Update persistent storage first
    updateState(newState);
    updateMaterials(newMaterials);
    updateServices(newServices);

    // Then update local state
    setState(newState);
    setMaterials(newMaterials);
    setServices(newServices);

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
      // Pechat maydoni = item eni × item bo'yi × soni
      const itemPrintArea = item.width * item.height * item.quantity;
      totalPrintArea += itemPrintArea;

      // Material sarfi = har bir item uchun o'z material eni × item bo'yi × soni
      const itemMaterialUsed = item.materialWidth * item.height * item.quantity;
      totalMaterialUsed += itemMaterialUsed;

      // Calculate material cost for this specific item using current material price
      // Try to find current material price from materials object
      let material = Object.values(materials).find(m => item.name.includes(m.name));
      if (!material) {
        // Fallback to partial matching for backward compatibility
        const materialName = item.name.split(' ')[0];
        material = Object.values(materials).find(m => m.name.includes(materialName));
      }
      // Always use current material price from materials object, not saved item.materialPrice
      const itemMaterialPrice = material?.price || 0;
      const itemMaterialCost = itemPrintArea * itemMaterialPrice;
      totalMaterialCost += itemMaterialCost;

      // Calculate waste cost for this specific item
      const itemWaste = Math.abs(itemMaterialUsed - itemPrintArea);
      // Find the waste price for this specific material
      // Try to match the full material name first, then fall back to partial matching
      let materialForWaste = Object.values(materials).find(m => item.name.includes(m.name));
      if (!materialForWaste) {
        // Fallback to partial matching for backward compatibility
        const materialName = item.name.split(' ')[0];
        materialForWaste = Object.values(materials).find(m => m.name.includes(materialName));
      }
      const itemWastePrice = materialForWaste?.wastePrice || 0;
      const itemWasteCost = itemWaste * itemWastePrice;
      totalWasteCost += itemWasteCost;

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

    const totalWaste = Math.abs(totalMaterialUsed - totalPrintArea);
    const wastePercentage = totalMaterialUsed > 0 ? (totalWaste / totalMaterialUsed) * 100 : 0;

    const printCost = 0;
    const totalCost = totalMaterialCost + printCost + totalWasteCost + totalServiceCost;

    // Calculate discount
    const discountAmount = (totalCost * state.discountPercentage) / 100;
    const finalCost = totalCost - discountAmount;

    return {
      totalPrintArea,
      totalMaterialUsed,
      totalWaste,
      wastePercentage,
      materialCost: totalMaterialCost,
      printCost,
      wasteCost: totalWasteCost,
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
            <p className="text-lg text-muted-foreground">
              Barcha turdagi bosma ishlar uchun to'liq hisob-kitob
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

            <WidthSelector
              widths={currentMaterial.widths}
              selectedWidth={state.selectedWidth}
              onSelect={selectWidth}
            />


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
              selectedWidth={state.selectedWidth}
              materialPrice={currentMaterial.price}
              materialName={currentMaterial.name}
              selectedService={state.selectedService}
              onAddItem={addItem}
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
              />
            </div>

            <OrderHistory
              onLoadOrder={handleLoadOrder}
              isOpen={showOrderHistory}
              onClose={() => setShowOrderHistory(false)}
              refreshTrigger={refreshTrigger}
              calculatorType="polygraphy"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
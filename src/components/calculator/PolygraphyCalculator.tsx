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
import { materials as initialMaterials, services as initialServices } from "../../data/calculatorData";
import { CalculatorState, Item, CalculationResults, Material, Service, ServiceVisibility, Order } from "../../types/calculator";
import { useOrders } from "../../hooks/useOrders";
import { useToast } from "../../hooks/use-toast";

export function PolygraphyCalculator() {
  const [materials, setMaterials] = useState(initialMaterials);
  const [services, setServices] = useState(initialServices);
  const [serviceVisibility, setServiceVisibility] = useState<ServiceVisibility>({});
  const [state, setState] = useState<CalculatorState>({
    items: [],
    selectedMaterial: 'banner',
    selectedWidth: 3.2,
    selectedService: 'none',
  });
  
  const { saveOrder } = useOrders();
  const { toast } = useToast();

  const currentMaterial = materials[state.selectedMaterial];

  const selectMaterial = (materialKey: string) => {
    const material = materials[materialKey];
    setState(prev => ({
      ...prev,
      selectedMaterial: materialKey,
      selectedWidth: material.widths[0], // Auto-select first width
    }));
  };

  const selectWidth = (width: number) => {
    setState(prev => ({
      ...prev,
      selectedWidth: width,
    }));
  };

  const selectService = (serviceKey: string) => {
    setState(prev => ({
      ...prev,
      selectedService: serviceKey,
    }));
  };

  const addItem = (item: Item) => {
    // Auto-generate product name with material name and width
    const materialName = currentMaterial.name;
    const autoName = `${materialName} (${item.materialWidth}m)`;
    
    // Use provided name or auto-generate
    const finalName = item.name.trim() || autoName;
    
    const itemWithAutoName = {
      ...item,
      name: finalName
    };
    
    setState(prev => ({
      ...prev,
      items: [...prev.items, itemWithAutoName],
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

  const handleSaveOrder = async (orderName: string) => {
    try {
      await saveOrder(orderName, state, results, materials, services);
      toast({
        title: "Buyurtma saqlandi",
        description: `"${orderName}" nomli buyurtma muvaffaqiyatli saqlandi`,
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

  const results = useMemo((): CalculationResults => {
    let totalPrintArea = 0;
    let totalMaterialUsed = 0;

    // Only calculate for visible items
    state.items.filter(item => item.isVisible).forEach(item => {
      // Pechat maydoni = item eni × item bo'yi × soni
      totalPrintArea += item.width * item.height * item.quantity;
      // Material sarfi = har bir item uchun o'z material eni × item bo'yi × soni
      totalMaterialUsed += item.materialWidth * item.height * item.quantity;
    });

    const totalWaste = Math.abs(totalMaterialUsed - totalPrintArea);
    const wastePercentage = totalMaterialUsed > 0 ? (totalWaste / totalMaterialUsed) * 100 : 0;

    const materialCost = totalPrintArea * currentMaterial.price;
    const wasteCost = totalWaste * currentMaterial.price;
    const printCost = 0;

    const currentService = services[state.selectedService];
    let serviceCost = 0;
    
    // Only calculate service cost if the service is visible
    const isServiceVisible = serviceVisibility[state.selectedService] ?? true;
    if (isServiceVisible && currentService) {
      if (currentService.type === 'per_sqm') {
        serviceCost = totalPrintArea * currentService.price;
      } else {
        serviceCost = currentService.price;
      }
    }

    const totalCost = materialCost + printCost + wasteCost + serviceCost;

    return {
      totalPrintArea,
      totalMaterialUsed,
      totalWaste,
      wastePercentage,
      materialCost,
      printCost,
      wasteCost,
      serviceCost,
      totalCost,
    };
  }, [state, currentMaterial, services, serviceVisibility]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Professional Poligrafiya Kalkulyatori
          </h1>
          <p className="text-xl text-muted-foreground">
            Barcha turdagi bosma ishlar uchun to'liq hisob-kitob
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
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

            <ItemForm
              selectedWidth={state.selectedWidth}
              materialPrice={currentMaterial.price}
              onAddItem={addItem}
            />

            <ServiceSelector
              services={services}
              selectedService={state.selectedService}
              onSelect={selectService}
            />

            {/* <ServiceVisibilityToggle
              services={services}
              visibility={serviceVisibility}
              onToggleVisibility={toggleServiceVisibility}
            /> */}

            {/* <ItemVisibilityToggle
              items={state.items}
              onToggleVisibility={toggleItemVisibility}
            /> */}

            <OrderForm
              onSaveOrder={handleSaveOrder}
              onShowHistory={() => {}} // Will be handled by OrderHistory component
              disabled={state.items.length === 0}
            />
          </div>

          {/* Right Column: Lists and Results */}
          <div className="xl:col-span-2 space-y-6">
            <ItemsList
              items={state.items}
              onDeleteItem={deleteItem}
              onToggleVisibility={toggleItemVisibility}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceList
                materials={materials}
                services={services}
                onUpdateMaterialPrice={updateMaterialPrice}
                onUpdateServicePrice={updateServicePrice}
              />

              <Results 
                results={results} 
                items={state.items} 
                materialPrice={currentMaterial.price}
                materials={materials}
              />
            </div>

            <OrderHistory onLoadOrder={handleLoadOrder} />
          </div>
        </div>
      </div>
    </div>
  );
}
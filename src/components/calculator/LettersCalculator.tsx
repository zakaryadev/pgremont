import { useState, useMemo, useEffect } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { MaterialSelector } from './MaterialSelector';
import { WidthSelector } from './WidthSelector';
import { ServiceSelector } from './ServiceSelector';
import { ItemForm } from './ItemForm';
import { ItemsList } from './ItemsList';
import { Results } from './Results';
import { PriceList } from './PriceList';
import { OrderForm } from './OrderForm';
import { OrderHistory } from './OrderHistory';
import { DiscountInput } from './DiscountInput';
import { useOrders } from '../../hooks/useOrders';
import { useCalculatorPersistence } from '../../hooks/useCalculatorPersistence';
import { useToast } from '../../hooks/use-toast';
import { CalculatorState, Item, CalculationResults, Order } from '../../types/calculator';
import { letterMaterials, letterServices } from '../../data/letterData';
import { Link } from 'react-router-dom';

export function LettersCalculator() {
  const { toast } = useToast();
  
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { saveOrder } = useOrders();
  
  // Use persistent storage for calculator data
  const {
    data,
    updateState,
    updateMaterials,
    updateServices,
    updateMaterialPrice,
    updateMaterialWastePrice,
    updateServicePrice,
  } = useCalculatorPersistence('letters');

  // Initialize with saved data or defaults
  const [materials, setMaterials] = useState(letterMaterials);
  const [services, setServices] = useState(letterServices);
  const [state, setState] = useState<CalculatorState>(data.state);

  // Update local state when persistent data changes (only on initial load)
  useEffect(() => {
    // Only update if current state is empty (initial load)
    if (state.items.length === 0 && Object.keys(materials).length === 0 && Object.keys(services).length === 0) {
      setState(data.state);
      setMaterials(data.materials && Object.keys(data.materials).length > 0 ? data.materials : letterMaterials);
      setServices(data.services && Object.keys(data.services).length > 0 ? data.services : letterServices);
    }
  }, [data]);


  const currentMaterial = materials[state.selectedMaterial];

  const selectMaterial = (materialKey: string) => {
    const newState = {
      ...state,
      selectedMaterial: materialKey,
      selectedWidth: 0, // Bukvalar uchun eni kerak emas
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

  const handleSaveOrder = async (orderData: { name: string; phone?: string }) => {
    try {
      await saveOrder(orderData.name, state, results, materials, services, orderData.phone, 'letters');
      
      // Clear the form after successful save
      const defaultState = {
        items: [],
        selectedMaterial: 'volumetric_no_led',
        selectedWidth: 0,
        selectedService: 'none',
        discountPercentage: 0,
      };
      setState(defaultState);
      updateState(defaultState);
      
      setRefreshTrigger(prev => prev + 1);
      toast({
        title: "Buyurtma saqlandi",
        description: `"${orderData.name}" nomli buyurtma muvaffaqiyatli saqlandi va forma tozalandi`,
      });
    } catch (error) {
      console.error('Failed to save order:', error);
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

    state.items.filter(item => item.isVisible).forEach(item => {
      // Light box uchun: eni(m) × bo'yi(m) × soni × narx per m²
      const isLightBox = item.name.toLowerCase().includes('световой короб') || item.name.toLowerCase().includes('light box');
      
      if (isLightBox) {
        // Light box uchun maydon bo'yicha hisoblash
        const itemPrintArea = item.width * item.height * item.quantity;
        totalPrintArea += itemPrintArea;
        
        const itemMaterialUsed = itemPrintArea; // Light box uchun material sarfi = maydon
        totalMaterialUsed += itemMaterialUsed;
        
        // Light box uchun: eni(m) × bo'yi(m) × soni × narx per m²
        const itemMaterialPrice = item.materialPrice;
        const itemMaterialCost = itemPrintArea * itemMaterialPrice;
        totalMaterialCost += itemMaterialCost;
        
        // Light box uchun chiqindi yo'q
        const itemWaste = 0;
        const itemWasteCost = 0;
        totalWasteCost += itemWasteCost;
      } else {
        // Bukvalar uchun: balandlik(cm) × soni × narx
        const itemPrintArea = 0; // Maydon hisoblanmaydi
        totalPrintArea += itemPrintArea;

        const itemMaterialUsed = 0; // Material sarfi hisoblanmaydi
        totalMaterialUsed += itemMaterialUsed;

        // Bukvalar uchun: balandlik(cm) × soni × narx
        const itemMaterialPrice = item.materialPrice;
        const itemMaterialCost = item.height * item.quantity * itemMaterialPrice;
        totalMaterialCost += itemMaterialCost;

        // Bukvalar uchun chiqindi yo'q
        const itemWaste = 0;
        const itemWasteCost = 0;
        totalWasteCost += itemWasteCost;
      }

      // Bukvalar va light box uchun xizmat narxi yo'q
      totalServiceCost += 0;
    });

    const totalWaste = 0; // Bukvalar uchun chiqindi yo'q
    const wastePercentage = 0; // Bukvalar uchun chiqindi foizi yo'q

    const printCost = 0;
    const totalCost = totalMaterialCost; // Faqat material narxi
    
    // Calculate discount
    const discountAmount = (totalCost * state.discountPercentage) / 100;
    const finalCost = totalCost - discountAmount;

    return {
      totalPrintArea,
      totalMaterialUsed,
      totalWaste: 0, // Bukvalar uchun chiqindi yo'q
      wastePercentage: 0, // Bukvalar uchun chiqindi foizi yo'q
      materialCost: totalMaterialCost,
      printCost,
      wasteCost: 0, // Bukvalar uchun chiqindi narxi yo'q
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
            <h1 className="text-3xl font-bold mb-2">Bukvalar kalkulyatori</h1>
            <p className="text-lg text-muted-foreground">
              O'lchamli harflar, yorug'lik korobi, akril va metal harflar uchun to'liq hisob-kitob
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          <div className="xl:col-span-1 space-y-6">
            <MaterialSelector
              materials={materials}
              selectedMaterial={state.selectedMaterial}
              onSelect={selectMaterial}
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
              selectedWidth={0} // Bukvalar uchun eni kerak emas
              materialPrice={currentMaterial.price}
              materialName={currentMaterial.name}
              selectedService={state.selectedService}
              onAddItem={addItem}
              isTablet={true} // Bukvalar uchun flag
            />
            <ServiceSelector
              services={services}
              selectedService={state.selectedService}
              selectedMaterial={state.selectedMaterial}
              onSelect={selectService}
            />
          </div>
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
                isTablet={true} // Bukvalar uchun flag
              />
            </div>
            <OrderHistory
              onLoadOrder={handleLoadOrder}
              isOpen={showOrderHistory}
              onClose={() => setShowOrderHistory(false)}
              refreshTrigger={refreshTrigger}
              calculatorType="letters"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
import { CalculatorState, Item, CalculationResults, Order } from '../../types/calculator';
import { letterMaterials, letterServices } from '../../data/letterData';

export function LettersCalculator() {
  // Use persistent storage for calculator data
  const {
    data,
    updateState,
    updateMaterials,
    updateServices,
  } = useCalculatorPersistence('letters');

  // Initialize with saved data or defaults
  const [materials, setMaterials] = useState(letterMaterials);
  const [services, setServices] = useState(letterServices);
  const [state, setState] = useState<CalculatorState>(data.state);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { saveOrder } = useOrders();

  // Update local state when persistent data changes
  useEffect(() => {
    console.log(`🔄 LettersCalculator: data o'zgargan, yangilanmoqda...`);
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
    
    // Update state if it has items or is different from current state
    if (data.state.items.length > 0 || JSON.stringify(data.state) !== JSON.stringify(state)) {
      setState(data.state);
    }
  }, [data]);

  const currentMaterial = materials[state.selectedMaterial];

  const selectMaterial = (materialKey: string) => {
    setState(prev => ({
      ...prev,
      selectedMaterial: materialKey,
      selectedWidth: 0, // Bukvalar uchun eni kerak emas
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

  const updateMaterialPrice = (materialKey: string, value: number) => {
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
      // Try to match the full material name first, then fall back to partial matching
      const materialName = materials[materialKey].name;
      const materialNameFirstWord = materialName.split(' ')[0];
      
      console.log(`🔍 Letters: Tekshirilmoqda: item="${item.name}", material="${materialName}", firstWord="${materialNameFirstWord}"`);
      
      if (item.name.includes(materialName) || item.name.includes(materialNameFirstWord)) {
        console.log(`📝 Letters: Item yangilanmoqda: ${item.name}, eski narx: ${item.materialPrice}, yangi narx: ${value}`);
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

  const handleSaveOrder = async (orderData: { name: string; phone?: string }) => {
    try {
      await saveOrder(orderData.name, state, results, materials, services, orderData.phone);
      setRefreshTrigger(prev => prev + 1);

      // Reset calculator
      setState({
        items: [],
        selectedMaterial: 'volumetric_no_led',
        selectedWidth: 0,
        selectedService: 'none',
        discountPercentage: 0,
      });
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  const handleLoadOrder = (order: Order) => {
    setState(order.state);
    setMaterials(order.materials);
    setServices(order.services);
    setShowOrderHistory(false);
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

    state.items.filter(item => item.isVisible).forEach(item => {
      // Light box uchun: eni(m) × bo'yi(m) × soni × narx per m²
      const isLightBox = item.name.toLowerCase().includes('световой короб') || item.name.toLowerCase().includes('light box') || item.name.toLowerCase().includes('тканевые');

      if (isLightBox) {
        // Light box uchun maydon bo'yicha hisoblash
        const itemPrintArea = item.width * item.height * item.quantity;
        totalPrintArea += itemPrintArea;

        const itemMaterialUsed = itemPrintArea; // Light box uchun material sarfi = maydon
        totalMaterialUsed += itemMaterialUsed;

        // Light box uchun: eni(m) × bo'yi(m) × soni × narx per m²
        // Try to find current material price from materials object
        let material = Object.values(materials).find(m => item.name.includes(m.name));
        if (!material) {
          // Fallback to partial matching for backward compatibility
          const materialName = item.name.split(' ')[0];
          material = Object.values(materials).find(m => m.name.includes(materialName));
        }
        const itemMaterialPrice = material?.price || 0;
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
        // Try to find current material price from materials object
        let material = Object.values(materials).find(m => item.name.includes(m.name));
        if (!material) {
          // Fallback to partial matching for backward compatibility
          const materialName = item.name.split(' ')[0];
          material = Object.values(materials).find(m => m.name.includes(materialName));
        }
        const itemMaterialPrice = material?.price || 0;
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
            <a href="/">
              <img
                src="/logo.png"
                alt="TOGO GROUP Logo"
                className="h-16 md:h-20 w-auto mb-4"
              />
            </a>
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
                onUpdateMaterialPrice={updateMaterialPrice}
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
            />
          </div>
        </div>
      </div>
    </div>
  );
}

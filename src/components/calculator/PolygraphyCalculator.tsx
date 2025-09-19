import { useState, useMemo } from "react";
import { MaterialSelector } from "./MaterialSelector";
import { WidthSelector } from "./WidthSelector";
import { ItemForm } from "./ItemForm";
import { ServiceSelector } from "./ServiceSelector";
import { ItemsList } from "./ItemsList";
import { PriceList } from "./PriceList";
import { Results } from "./Results";
import { materials as initialMaterials, services as initialServices } from "../../data/calculatorData";
import { CalculatorState, Item, CalculationResults, Material, Service } from "../../types/calculator";

export function PolygraphyCalculator() {
  const [materials, setMaterials] = useState(initialMaterials);
  const [services, setServices] = useState(initialServices);
  const [state, setState] = useState<CalculatorState>({
    items: [],
    selectedMaterial: 'banner',
    selectedWidth: 3.2,
    selectedService: 'none',
  });

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

  const updateMaterialPrice = (materialKey: string, field: 'materialPrice' | 'printPrice', value: number) => {
    if (isNaN(value)) return;
    setMaterials(prev => ({
      ...prev,
      [materialKey]: {
        ...prev[materialKey],
        [field]: value,
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

  const results = useMemo((): CalculationResults => {
    let totalPrintArea = 0;
    let totalMaterialUsed = 0;

    state.items.forEach(item => {
      totalPrintArea += item.width * item.height * item.quantity;
      totalMaterialUsed += state.selectedWidth * item.height * item.quantity;
    });

    const totalWaste = totalMaterialUsed - totalPrintArea;
    const wastePercentage = totalMaterialUsed > 0 ? (totalWaste / totalMaterialUsed) * 100 : 0;

    const materialCost = totalMaterialUsed * currentMaterial.materialPrice;
    const printCost = totalPrintArea * currentMaterial.printPrice;

    const currentService = services[state.selectedService];
    let serviceCost = 0;
    if (currentService.type === 'per_sqm') {
      serviceCost = totalPrintArea * currentService.price;
    } else {
      serviceCost = currentService.price;
    }

    const totalCost = materialCost + printCost + serviceCost;

    return {
      totalPrintArea,
      totalMaterialUsed,
      totalWaste,
      wastePercentage,
      materialCost,
      printCost,
      serviceCost,
      totalCost,
    };
  }, [state, currentMaterial, services]);

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
              onAddItem={addItem}
            />

            <ServiceSelector
              services={services}
              selectedService={state.selectedService}
              onSelect={selectService}
            />
          </div>

          {/* Right Column: Lists and Results */}
          <div className="xl:col-span-2 space-y-6">
            <ItemsList
              items={state.items}
              onDeleteItem={deleteItem}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PriceList
                materials={materials}
                services={services}
                onUpdateMaterialPrice={updateMaterialPrice}
                onUpdateServicePrice={updateServicePrice}
              />

              <Results results={results} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
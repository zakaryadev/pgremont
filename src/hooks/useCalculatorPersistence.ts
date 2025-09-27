import { useState, useEffect, useCallback } from 'react';
import { CalculatorState, Material, Service } from '../types/calculator';

interface CalculatorData {
  state: CalculatorState;
  materials: Record<string, Material>;
  services: Record<string, Service>;
}

export function useCalculatorPersistence(calculatorType: 'polygraphy' | 'tablets' | 'letters') {
  const [data, setData] = useState<CalculatorData>({
    state: {
      items: [],
      selectedMaterial: getDefaultMaterial(calculatorType),
      selectedWidth: 0,
      selectedService: 'none',
      discountPercentage: 0,
    },
    materials: {},
    services: {},
  });

  // Get default material for each calculator type
  function getDefaultMaterial(type: 'polygraphy' | 'tablets' | 'letters'): string {
    switch (type) {
      case 'polygraphy':
        return 'banner';
      case 'tablets':
        return 'romark';
      case 'letters':
        return 'volumetric_no_led';
      default:
        return 'banner';
    }
  }

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem(`calculator_${calculatorType}`);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        // Ensure materials and services are not empty objects
        const dataWithDefaults = {
          ...parsedData,
          materials: parsedData.materials && Object.keys(parsedData.materials).length > 0 ? parsedData.materials : {},
          services: parsedData.services && Object.keys(parsedData.services).length > 0 ? parsedData.services : {},
        };
        setData(dataWithDefaults);
      } catch (error) {
        console.error('Failed to parse saved calculator data:', error);
      }
    }
  }, [calculatorType]);

  // Save data to localStorage whenever it changes
  const saveData = useCallback((newData: CalculatorData) => {
    setData(newData);
    localStorage.setItem(`calculator_${calculatorType}`, JSON.stringify(newData));
  }, [calculatorType]);

  // Update state
  const updateState = useCallback((newState: CalculatorState) => {
    const newData = { ...data, state: newState };
    saveData(newData);
  }, [data, saveData]);

  // Update materials
  const updateMaterials = useCallback((newMaterials: Record<string, Material>) => {
    const newData = { ...data, materials: newMaterials };
    saveData(newData);
  }, [data, saveData]);

  // Update services
  const updateServices = useCallback((newServices: Record<string, Service>) => {
    const newData = { ...data, services: newServices };
    saveData(newData);
  }, [data, saveData]);

  // Update material price
  const updateMaterialPrice = useCallback((materialKey: string, value: number) => {
    if (isNaN(value)) return;
    const newMaterials = {
      ...data.materials,
      [materialKey]: {
        ...data.materials[materialKey],
        price: value,
      }
    };
    updateMaterials(newMaterials);
  }, [data.materials, updateMaterials]);

  // Update material waste price
  const updateMaterialWastePrice = useCallback((materialKey: string, value: number) => {
    if (isNaN(value)) return;
    const newMaterials = {
      ...data.materials,
      [materialKey]: {
        ...data.materials[materialKey],
        wastePrice: value,
      }
    };
    updateMaterials(newMaterials);
  }, [data.materials, updateMaterials]);

  // Update service price
  const updateServicePrice = useCallback((serviceKey: string, value: number) => {
    if (isNaN(value)) return;
    const newServices = {
      ...data.services,
      [serviceKey]: {
        ...data.services[serviceKey],
        price: value,
      }
    };
    updateServices(newServices);
  }, [data.services, updateServices]);

  // Clear calculator data
  const clearData = useCallback(() => {
    const defaultData: CalculatorData = {
      state: {
        items: [],
        selectedMaterial: getDefaultMaterial(calculatorType),
        selectedWidth: 0,
        selectedService: 'none',
        discountPercentage: 0,
      },
      materials: {},
      services: {},
    };
    saveData(defaultData);
  }, [calculatorType, saveData]);

  return {
    data,
    updateState,
    updateMaterials,
    updateServices,
    updateMaterialPrice,
    updateMaterialWastePrice,
    updateServicePrice,
    clearData,
  };
}

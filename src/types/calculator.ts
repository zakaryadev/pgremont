export interface Material {
  name: string;
  widths: number[];
  materialPrice: number;
  printPrice: number;
}

export interface Service {
  name: string;
  price: number;
  type: 'fixed' | 'per_sqm';
}

export interface Item {
  width: number;
  height: number;
  quantity: number;
}

export interface CalculatorState {
  items: Item[];
  selectedMaterial: string;
  selectedWidth: number;
  selectedService: string;
}

export interface CalculationResults {
  totalPrintArea: number;
  totalMaterialUsed: number;
  totalWaste: number;
  wastePercentage: number;
  materialCost: number;
  printCost: number;
  serviceCost: number;
  totalCost: number;
}
export interface Material {
  name: string;
  widths: number[];
  price: number;
}

export interface Service {
  name: string;
  price: number;
  type: 'fixed' | 'per_sqm';
}

export interface Item {
  id: string;
  name: string;
  width: number;
  height: number;
  quantity: number;
  isVisible: boolean;
  materialWidth: number;
  materialPrice: number;
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
  wasteCost: number;
  serviceCost: number;
  totalCost: number;
}

export interface Order {
  id: string;
  name: string;
  createdAt: Date;
  state: CalculatorState;
  results: CalculationResults;
  materials: Record<string, Material>;
  services: Record<string, Service>;
}

export interface ServiceVisibility {
  [serviceKey: string]: boolean;
}
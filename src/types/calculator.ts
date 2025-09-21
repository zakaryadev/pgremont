export interface Material {
  name: string;
  widths: number[];
  price: number;
  wastePrice: number; // Chiqindi uchun alohida narx
}

export interface Service {
  name: string;
  price: number;
  type: 'fixed' | 'per_sqm';
  materials?: string[]; // Material turlari ro'yxati (agar bo'sh bo'lsa, barcha materiallar uchun)
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
  assemblyService?: string; // Assembly service for this specific item
  disassemblyService?: string; // Disassembly service for this specific item
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
  phone?: string;
  createdAt: Date;
  state: CalculatorState;
  results: CalculationResults;
  materials: Record<string, Material>;
  services: Record<string, Service>;
}

export interface ServiceVisibility {
  [serviceKey: string]: boolean;
}
import { Material, Service } from '../types/calculator';

export const tableMaterials: Record<string, Material> = {
  romark: { 
    name: 'Romark tablichka', 
    widths: [], // Tablichkalar uchun material eni yo'q
    price: 1400000, // 1,400,000 so'm per m²
    wastePrice: 200000
  },
  plexiglass: { 
    name: 'Orgsteklo (Plexiglass) tablichka', 
    widths: [], // Tablichkalar uchun material eni yo'q
    price: 1900000, // 1,900,000 so'm per m²
    wastePrice: 300000
  },
  acrylic: { 
    name: 'Akril tablichka', 
    widths: [], // Tablichkalar uchun material eni yo'q
    price: 2200000, // 2,200,000 so'm per m²
    wastePrice: 400000
  },
  badge: { 
    name: 'Beydjik (7x4 cm)', 
    widths: [], // Beydjik uchun eni kerak emas
    price: 35000, // 35,000 so'm
    wastePrice: 5000
  },
  premium_badge: { 
    name: 'Premium beydjik (7x4 cm)', 
    widths: [], // Premium beydjik uchun eni kerak emas
    price: 55000, // 55,000 so'm
    wastePrice: 8000
  },
  statue: { 
    name: 'Statuetka (Acrylic)', 
    widths: [], // Statuetka uchun eni kerak emas
    price: 200000, // from 200,000 so'm
    wastePrice: 40000
  },
  bolt: { 
    name: 'Distansion bolt', 
    widths: [], // Bolt uchun eni kerak emas
    price: 10000, // 10,000 so'm
    wastePrice: 2000
  }
};

export const tableServices: Record<string, Service> = {
  none: {
    name: 'Xizmat tanlanmagan',
    price: 0,
    type: 'fixed'
  }
};

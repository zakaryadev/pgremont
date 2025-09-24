import { Material, Service } from '../types/calculator';

export const tableMaterials: Record<string, Material> = {
  romark: { 
    name: '(ABC) Romark Tablichka', 
    widths: [], // Tablichkalar uchun material eni yo'q
    price: 1400000, // 1,400,000 so'm per m²
    wastePrice: 200000
  },
  plexiglass: { 
    name: 'Akril (Alyukabond) Tablichka', 
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
    price: 6000, // 10,000 so'm
    wastePrice: 2000
  },
  stand_orgsteklo_3mm: { 
    name: 'Stend Orgsteklo (3mm)', 
    widths: [], // Stend uchun eni va bo'yi kerak
    price: 500000, // 500,000 so'm per m²
    wastePrice: 0
  },
  stand_orgsteklo_5mm: { 
    name: 'Stend Orgsteklo (5mm)', 
    widths: [], // Stend uchun eni va bo'yi kerak
    price: 650000, // 650,000 so'm per m²
    wastePrice: 0
  },
  stand_alyukabond: { 
    name: 'Stend Alyukabond', 
    widths: [], // Stend uchun eni va bo'yi kerak
    price: 500000, // 500,000 so'm per m²
    wastePrice: 0
  },
  stand_fomiks: { 
    name: 'Stend Fomiks', 
    widths: [], // Stend uchun eni va bo'yi kerak
    price: 350000, // 350,000 so'm per m²
    wastePrice: 0
  }
};

export const tableServices: Record<string, Service> = {
  none: {
    name: 'Xizmat tanlanmagan',
    price: 0,
    type: 'fixed'
  }
};

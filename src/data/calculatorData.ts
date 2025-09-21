import { Material, Service } from '../types/calculator';

export const materials: Record<string, Material> = {
  banner: { 
    name: 'Баннер', 
    widths: [3.2, 2.6, 2.2, 1.8, 1.6, 1.3, 1.1], 
    price: 55000,
    wastePrice: 15000
  },
  oracal: { 
    name: 'Оракал', 
    widths: [1.52, 1.27, 1.07], 
    price: 85000,
    wastePrice: 20000
  },
  setka: { 
    name: 'Сеточный оракал', 
    widths: [1.52, 1.27, 1.07], 
    price: 75000,
    wastePrice: 25000
  },
  prozrachka: { 
    name: 'Прозрачный оракал', 
    widths: [1.52, 1.27, 1.07], 
    price: 105000,
    wastePrice: 25000
  },
  holst: { 
    name: 'Холст', 
    widths: [1.5, 1.2, 0.9], 
    price: 170000,
    wastePrice: 50000
  },
  bekprint: { 
    name: 'Бекпринт', 
    widths: [1.52, 1.27, 1.07], 
    price: 120000,
    wastePrice: 35000
  }
};

export const services: Record<string, Service> = {
  none: { 
    name: 'Xizmat tanlanmagan', 
    price: 0, 
    type: 'fixed' 
  },
  install: { 
    name: 'Установка', 
    price: 25000, 
    type: 'per_sqm',
    materials: ['banner', 'holst'] // banner va holst uchun
  },
  install_rails: { 
    name: 'Установка с рейками', 
    price: 55000, 
    type: 'per_sqm',
    materials: ['banner', 'holst'] // banner va holst uchun
  },
  install_oracal: { 
    name: 'Установка оракал', 
    price: 45000, 
    type: 'per_sqm',
    materials: ['oracal', 'setka', 'prozrachka'] // oracal, setka va prozrachka uchun
  },
  install_dismantle: { 
    name: 'Установка + Демонтаж', 
    price: 60000, 
    type: 'per_sqm',
    materials: ['oracal', 'setka', 'prozrachka'] // oracal, setka va prozrachka uchun
  },
};
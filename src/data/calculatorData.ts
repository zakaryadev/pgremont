import { Material, Service } from '../types/calculator';

export const materials: Record<string, Material> = {
  banner: { 
    name: 'Баннер', 
    widths: [3.2, 2.6, 2.2, 1.8, 1.6], 
    materialPrice: 25000, 
    printPrice: 30000 
  },
  oracal: { 
    name: 'Аракал', 
    widths: [1.52, 1.27, 1.07], 
    materialPrice: 40000, 
    printPrice: 45000 
  },
  setka: { 
    name: 'Сетка', 
    widths: [3.2, 2.2, 1.6], 
    materialPrice: 35000, 
    printPrice: 40000 
  },
  prozrachka: { 
    name: 'Прозрачка', 
    widths: [1.52, 1.27, 1.07], 
    materialPrice: 50000, 
    printPrice: 55000 
  },
  holst: { 
    name: 'Холст', 
    widths: [1.5, 1.2, 0.9], 
    materialPrice: 80000, 
    printPrice: 90000 
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
    price: 15000, 
    type: 'per_sqm' 
  },
  install_rails: { 
    name: 'Установка с рейками', 
    price: 25000, 
    type: 'per_sqm' 
  },
  install_dismantle: { 
    name: 'Установка + Демонтаж', 
    price: 30000, 
    type: 'per_sqm' 
  },
};
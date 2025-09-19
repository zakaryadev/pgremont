import { Material, Service } from '../types/calculator';

export const materials: Record<string, Material> = {
  banner: { 
    name: 'Баннер', 
    widths: [3.2, 2.6, 2.2, 1.8, 1.6], 
    price: 55000
  },
  oracal: { 
    name: 'Аракал', 
    widths: [1.52, 1.27, 1.07], 
    price: 85000
  },
  setka: { 
    name: 'Сетка', 
    widths: [3.2, 2.2, 1.6], 
    price: 75000
  },
  prozrachka: { 
    name: 'Прозрачка', 
    widths: [1.52, 1.27, 1.07], 
    price: 105000
  },
  holst: { 
    name: 'Холст', 
    widths: [1.5, 1.2, 0.9], 
    price: 170000
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
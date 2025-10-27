import { Material, Service } from '../types/calculator';

export const materials: Record<string, Material> = {
  banner: { 
    name: 'Баннер', 
    widths: [3.2, 2.6, 2.2, 1.8, 1.6, 1.3, 1.1], 
    price: 35000,
    wastePrice: 15000
  },
  oracal: { 
    name: 'Оракал', 
    widths: [1.52, 1.27, 1.07], 
    price: 45000,
    wastePrice: 20000
  },
  setka: { 
    name: 'Сеточный оракал', 
    widths: [1.52, 1.27, 1.07], 
    price: 55000,
    wastePrice: 25000
  },
  prozrachka: { 
    name: 'Прозрачный оракал', 
    widths: [1.52, 1.27, 1.07], 
    price: 55000,
    wastePrice: 25000
  },
  holst: { 
    name: 'Холст', 
    widths: [1.5, 1.2, 0.9], 
    price: 120000,
    wastePrice: 50000
  },
  bekprint: { 
    name: 'Бекпринт', 
    widths: [0.9, 1.22, 1.52], 
    price: 80000,
    wastePrice: 35000
  },
  solncez: { 
    name: 'Солнцезащита', 
    widths: [1.52, 0.76], 
    price: 150000,
    wastePrice: 50000
  },
  tanirovka: { 
    name: 'Танировка', 
    widths: [1.52, 0.76], 
    price: 120000,
    wastePrice: 65000
  },
  tumanka: { 
    name: 'Туманка', 
    widths: [1.27], 
    price: 120000,
    wastePrice: 45000
  },
};

export const services: Record<string, Service> = {
  none: { 
    name: 'Xizmat tanlanmagan', 
    price: 0, 
    type: 'fixed' 
  },
  banner_ustanovka: {
    name: 'Установка баннера',
    price: 25000,
    type: 'per_sqm',
    materials: ['banner']
  },
  banner_ustanovka_reika: {
    name: 'Установка баннера с рейкой',
    price: 55000,
    type: 'per_sqm',
    materials: ['banner']
  },
  banner_bez_ustanovki_reika: {
    name: 'Без установки с рейкой',
    price: 30000,
    type: 'per_sqm',
    materials: ['banner']
  },
  holst_ustanovka: {
    name: 'Установка холста',
    price: 25000,
    type: 'per_sqm',
    materials: ['holst']
  },
  holst_ustanovka_reika: {
    name: 'Установка холста с рейкой',
    price: 55000,
    type: 'per_sqm',
    materials: ['holst']
  },
  oracal_ustanovka: {
    name: 'Установка оракала',
    price: 45000,
    type: 'per_sqm',
    materials: ['oracal', 'setka', 'prozrachka']
  },
  oracal_ustanovka_demontaj: {
    name: 'Установка + демонтаж оракала',
    price: 60000,
    type: 'per_sqm',
    materials: ['oracal', 'setka', 'prozrachka']
  }
};
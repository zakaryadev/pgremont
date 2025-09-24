import { Material, Service } from '../types/calculator';

export const letterMaterials: Record<string, Material> = {
  volumetric_no_led: { 
    name: 'Обьемная буква (Без диод)', 
    widths: [], // Bukvalar uchun faqat bo'yi (balandlik) kerak
    price: 7000, // 7,000 so'm per cm
    wastePrice: 0
  },
  volumetric_simple: { 
    name: 'Обьемная буква (Простой)', 
    widths: [], // Bukvalar uchun faqat bo'yi (balandlik) kerak
    price: 9000, // 9,000 so'm per cm
    wastePrice: 0
  },
  volumetric_mesh: { 
    name: 'Обьемная буква (Сеточний)', 
    widths: [], // Bukvalar uchun faqat bo'yi (balandlik) kerak
    price: 10000, // 10,000 so'm per cm
    wastePrice: 0
  },
  volumetric_contour: { 
    name: 'Обьемная буква (Контройорный)', 
    widths: [], // Bukvalar uchun faqat bo'yi (balandlik) kerak
    price: 10000, // 10,000 so'm per cm
    wastePrice: 0
  },
  volumetric_acrylic_border: { 
    name: 'Обьемная буква (Борт акрил)', 
    widths: [], // Bukvalar uchun faqat bo'yi (balandlik) kerak
    price: 14000, // 14,000 so'm per cm
    wastePrice: 0
  },
  volumetric_dotted: { 
    name: 'Обьемная буква (Точечные)', 
    widths: [], // Bukvalar uchun faqat bo'yi (balandlik) kerak
    price: 16000, // 16,000 so'm per cm
    wastePrice: 0
  },
  light_box: { 
    name: 'Световой короб', 
    widths: [], // Light box uchun eni va bo'yi kerak
    price: 1500000, // 1,500,000 so'm per m²
    wastePrice: 0
  }
};

export const letterServices: Record<string, Service> = {
  none: { 
    name: 'Xizmat tanlanmagan', 
    price: 0, 
    type: 'fixed' 
  }
};

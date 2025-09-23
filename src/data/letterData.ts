import { Material, Service } from '../types/calculator';

export const letterMaterials: Record<string, Material> = {
  acrylic_letters: { 
    name: 'Akril harflar', 
    widths: [], // Bukvalar uchun faqat bo'yi (balandlik) kerak
    price: 9000, // 9,000 so'm per cm
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

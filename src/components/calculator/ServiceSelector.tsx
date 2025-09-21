import { Card } from "../ui/card";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Label } from "../ui/label";

interface ServiceSelectorProps {
  services: Record<string, { name: string; price: number; type: string; materials?: string[] }>;
  selectedService: string;
  selectedMaterial: string;
  onSelect: (serviceKey: string) => void;
}

export function ServiceSelector({ services, selectedService, selectedMaterial, onSelect }: ServiceSelectorProps) {
  // Faqat tanlangan material uchun mos xizmatlarni filtrlash
  const availableServices = Object.entries(services).filter(([key, service]) => {
    // Agar xizmatda materials array bo'lmasa yoki bo'sh bo'lsa, barcha materiallar uchun
    if (!service.materials || service.materials.length === 0) {
      return true;
    }
    // Agar materials array mavjud bo'lsa, tanlangan material uning ichida bo'lishi kerak
    return service.materials.includes(selectedMaterial);
  });

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">4. Qo'shimcha xizmatlar</h2>
      <RadioGroup value={selectedService} onValueChange={onSelect} className="space-y-2">
        {availableServices.map(([key, service]) => (
          <div key={key} className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
            <RadioGroupItem value={key} id={`service-${key}`} />
            <Label 
              htmlFor={`service-${key}`} 
              className="flex-1 cursor-pointer font-medium text-sm"
            >
              {service.name}
              {key !== 'none' && (
                <span className="text-muted-foreground text-xs block">
                  {service.price.toLocaleString()} so'm {service.type === 'per_sqm' ? '(m² uchun)' : '(dona uchun)'}
                </span>
              )}
            </Label>
          </div>
        ))}
      </RadioGroup>
    </Card>
  );
}
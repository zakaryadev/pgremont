import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { Service, ServiceVisibility } from '../../types/calculator';

interface ServiceVisibilityToggleProps {
  services: Record<string, Service>;
  visibility: ServiceVisibility;
  onToggleVisibility: (serviceKey: string) => void;
}

export function ServiceVisibilityToggle({ 
  services, 
  visibility, 
  onToggleVisibility 
}: ServiceVisibilityToggleProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Xizmatlarni boshqarish
        </CardTitle>
        <CardDescription>
          Qaysi xizmatlarni hisob-kitobga qo'shishni belgilang
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(services).map(([key, service]) => {
          if (key === 'none') return null; // Skip "none" service
          
          const isVisible = visibility[key] ?? true;
          
          return (
            <div key={key} className="flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                {isVisible ? (
                  <Eye className="h-4 w-4 text-green-600" />
                ) : (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                )}
                <Label htmlFor={`service-${key}`} className="text-sm font-medium">
                  {service.name}
                </Label>
              </div>
              <Switch
                id={`service-${key}`}
                checked={isVisible}
                onCheckedChange={() => onToggleVisibility(key)}
              />
            </div>
          );
        })}
        
        {Object.keys(services).filter(key => key !== 'none').length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Hozircha hech qanday xizmat mavjud emas
          </p>
        )}
      </CardContent>
    </Card>
  );
}

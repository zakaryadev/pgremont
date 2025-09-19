import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface MaterialSelectorProps {
  materials: Record<string, { name: string }>;
  selectedMaterial: string;
  onSelect: (materialKey: string) => void;
}

export function MaterialSelector({ materials, selectedMaterial, onSelect }: MaterialSelectorProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">1. Material tanlang</h2>
      <div className="flex flex-wrap gap-2">
        {Object.entries(materials).map(([key, material]) => (
          <Button
            key={key}
            variant={selectedMaterial === key ? "default" : "outline"}
            className={`${
              selectedMaterial === key 
                ? "bg-primary hover:bg-primary-hover text-primary-foreground" 
                : "border-border hover:bg-muted"
            } transition-all duration-300`}
            onClick={() => onSelect(key)}
          >
            {material.name}
          </Button>
        ))}
      </div>
    </Card>
  );
}
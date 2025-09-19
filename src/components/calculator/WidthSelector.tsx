import { Button } from "../ui/button";
import { Card } from "../ui/card";

interface WidthSelectorProps {
  widths: number[];
  selectedWidth: number;
  onSelect: (width: number) => void;
}

export function WidthSelector({ widths, selectedWidth, onSelect }: WidthSelectorProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">2. Material enini tanlang (m)</h2>
      <div className="flex flex-wrap gap-2">
        {widths.map((width) => (
          <Button
            key={width}
            variant={selectedWidth === width ? "default" : "outline"}
            className={`${
              selectedWidth === width 
                ? "bg-primary hover:bg-primary-hover text-primary-foreground" 
                : "border-border hover:bg-muted"
            } transition-all duration-300`}
            onClick={() => onSelect(width)}
          >
            {width.toFixed(2)}
          </Button>
        ))}
      </div>
    </Card>
  );
}
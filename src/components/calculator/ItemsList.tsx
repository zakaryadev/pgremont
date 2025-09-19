import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import { Trash2 } from "lucide-react";
import { Item } from "../../types/calculator";

interface ItemsListProps {
  items: Item[];
  onDeleteItem: (index: number) => void;
}

export function ItemsList({ items, onDeleteItem }: ItemsListProps) {
  return (
    <Card className="p-6 bg-gradient-to-br from-card to-muted/20">
      <h2 className="text-xl font-semibold mb-4 text-foreground">Qo'shilgan Ishlar Ro'yxati</h2>
      
      {items.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          Hozircha ishlar qo'shilmagan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Eni (m)</TableHead>
                <TableHead>Bo'yi (m)</TableHead>
                <TableHead>Soni</TableHead>
                <TableHead>Maydoni (m²)</TableHead>
                <TableHead>Amal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => {
                const area = (item.width * item.height * item.quantity).toFixed(2);
                return (
                  <TableRow key={index} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{item.width}</TableCell>
                    <TableCell>{item.height}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell className="font-semibold">{area}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDeleteItem(index)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  );
}
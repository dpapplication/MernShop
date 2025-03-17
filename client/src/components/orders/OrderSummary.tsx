
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface OrderItem {
  _id: string;
  produit: string;
  prix: string;
  quantite: string;
  remise: string;
}

interface OrderSummaryProps {
  orderItems: OrderItem[];
  onDeleteItem: (_id: string) => void;
}

export default function OrderSummary({ orderItems, onDeleteItem }: OrderSummaryProps) {
  const { toast } = useToast();

  const handleDelete = (id: string, produit: string) => {
    onDeleteItem(id);
    toast({
      title: "Produit retiré",
      description: `${produit} a été retiré de la commande`,
    });
  };

  const calculateSubtotal = () => {
    return orderItems.reduce((total, item) => {
      const prix = parseFloat(item.prix);
      const quantite = parseInt(item.quantite);
      const remise = parseFloat(item.remise) || 0;
      return total + (prix * quantite * (1 - remise / 100));
    }, 0).toFixed(2);
  };

  return (
    <Card className="w-full glass-panel animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Récapitulatif de la commande</CardTitle>
        <CardDescription>
          {orderItems.length} {orderItems.length > 1 ? 'articles' : 'article'} dans la commande
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Produit</TableHead>
                <TableHead className="font-medium text-right">Prix</TableHead>
                <TableHead className="font-medium text-right">Quantité</TableHead>
                <TableHead className="font-medium text-right">Remise</TableHead>
                <TableHead className="font-medium text-right">Total</TableHead>
                <TableHead className="font-medium text-right w-[70px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderItems.length > 0 ? (
                orderItems.map((item, index) => {
                  const prix = parseFloat(item.prix);
                  const quantite = parseInt(item.quantite);
                  const remise = parseFloat(item.remise) || 0;
                  const total = (prix * quantite * (1 - remise / 100)).toFixed(2);
                  
                  return (
                    <TableRow key={index} className="group animate-fade-in">
                      <TableCell className="font-medium">{item.produit}</TableCell>
                      <TableCell className="text-right">{item.prix} €</TableCell>
                      <TableCell className="text-right">{item.quantite}</TableCell>
                      <TableCell className="text-right">{item.remise} %</TableCell>
                      <TableCell className="text-right font-medium">{total} €</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(item._id, item.produit)}
                          className="h-8 w-8 opacity-70 group-hover:opacity-100 transition-opacity hover:text-destructive hover:opacity-100"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    Aucun produit dans la commande
                  </TableCell>
                </TableRow>
              )}
              {orderItems.length > 0 && (
                <TableRow className="bg-muted/50">
                  <TableCell colSpan={4} className="text-right font-medium">
                    Sous-total
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {calculateSubtotal()} €
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

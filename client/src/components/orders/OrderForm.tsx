
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface OrderFormProps {
  selectedProduct: {
    _id: string;
    nom: string;
    prix: string;
  } | null;
  onAddToOrder: (orderItem: OrderItem) => void;
}

interface OrderItem {
  _id: string;
  produit: string;
  prix: string;
  quantite: string;
  remise: string;
}

export default function OrderForm({ selectedProduct, onAddToOrder }: OrderFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    quantite: '1',
    remise: '0'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) {
      toast({
        title: "Produit requis",
        description: "Veuillez sélectionner un produit d'abord",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.quantite || parseInt(formData.quantite) < 1) {
      toast({
        title: "Quantité invalide",
        description: "La quantité doit être au moins de 1",
        variant: "destructive",
      });
      return;
    }
    
    const orderItem: OrderItem = {
      _id: selectedProduct._id,
      produit: selectedProduct.nom,
      prix: selectedProduct.prix,
      quantite: formData.quantite,
      remise: formData.remise || '0'
    };
    
    onAddToOrder(orderItem);
    
    // Reset form
    setFormData({
      quantite: '1',
      remise: '0'
    });
    
    toast({
      title: "Produit ajouté",
      description: `${selectedProduct.nom} ajouté à la commande`,
    });
  };

  const calculateTotal = () => {
    if (!selectedProduct) return 0;
    
    const prix = parseFloat(selectedProduct.prix);
    const quantite = parseInt(formData.quantite) || 0;
    const remise = parseFloat(formData.remise) || 0;
    
    return (prix * quantite * (1 - remise / 100)).toFixed(2);
  };

  return (
    <Card className="w-full glass-panel animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Ajouter à la commande</CardTitle>
        {selectedProduct ? (
          <CardDescription className="mt-2">
            Produit sélectionné: <span className="font-medium">{selectedProduct.nom}</span>
          </CardDescription>
        ) : (
          <CardDescription className="mt-2">
            Sélectionnez un produit dans la liste
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="produit">Produit</Label>
            <Input
              id="produit"
              value={selectedProduct?.nom || ''}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prix">Prix unitaire (€)</Label>
            <Input
              id="prix"
              value={selectedProduct?.prix || ''}
              readOnly
              className="bg-muted"
            />
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantite">Quantité</Label>
              <Input
                id="quantite"
                name="quantite"
                type="number"
                min="1"
                placeholder="Quantité"
                value={formData.quantite}
                onChange={handleChange}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="remise">Remise (%)</Label>
              <Input
                id="remise"
                name="remise"
                type="number"
                min="0"
                max="100"
                placeholder="Remise"
                value={formData.remise}
                onChange={handleChange}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
          
          <div className="pt-2 border-t mt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total:</span>
              <span className="text-lg font-semibold">{calculateTotal()} €</span>
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-6 group transition-all"
            disabled={!selectedProduct}
          >
            <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Ajouter à la commande
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

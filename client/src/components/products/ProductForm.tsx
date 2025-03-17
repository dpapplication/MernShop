
import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ProductFormProps {
  onProductAdded: (product: Product) => void;
}

interface Product {
  _id?: string;
  nom: string;
  prix: string;
  stock: string;
}

export default function ProductForm({ onProductAdded }: ProductFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nom: '',
    prix: '',
    stock: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nom || !formData.prix || !formData.stock) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs du formulaire",
        variant: "destructive",
      });
      return;
    }
    
    // Create product object with unique ID
    const newProduct: Product = {
      ...formData
    };
    
    // Pass to parent component
    onProductAdded(newProduct);
    
    // Reset form
    setFormData({
      nom: '',
      prix: '',
      stock: ''
    });
    
    // Show success toast
    toast({
      title: "Produit ajouté",
      description: "Le produit a été ajouté avec succès",
    });
  };

  return (
    <Card className="w-full glass-panel animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Ajouter un Produit</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom du produit</Label>
            <Input
              id="nom"
              name="nom"
              placeholder="Nom du produit"
              value={formData.nom}
              onChange={handleChange}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="prix">Prix (€)</Label>
            <Input
              id="prix"
              name="prix"
              type="number"
              step="0.01"
              min="0"
              placeholder="Prix unitaire"
              value={formData.prix}
              onChange={handleChange}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              placeholder="Quantité en stock"
              value={formData.stock}
              onChange={handleChange}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-6 group transition-all"
          >
            <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Ajouter le produit
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

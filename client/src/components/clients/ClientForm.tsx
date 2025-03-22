
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

interface ClientFormProps {
  onClientAdded: (client: Client) => void;
}

interface Client {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
}

export default function ClientForm({ onClientAdded }: ClientFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.nom || !formData.adresse) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs du formulaire",
        variant: "destructive",
      });
      return;
    }
    
    // Create client object with unique ID
    const newClient: Client = {
      id: crypto.randomUUID(),
      ...formData
    };
    
    // Pass to parent component
    onClientAdded(newClient);
    
    // Reset form
    setFormData({
      nom: '',
      adresse: '',
      telephone: ''
    });
    
    // Show success toast
    toast({
      title: "Client ajouté",
      description: "Le client a été ajouté avec succès",
    });
  };

  return (
    <Card className="w-full glass-panel animate-fade-in">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl">Ajouter un Client</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input
              id="nom"
              name="nom"
              placeholder="Nom du client"
              value={formData.nom}
              onChange={handleChange}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="adresse">Adresse</Label>
            <Input
              id="adresse"
              name="adresse"
              placeholder="Adresse complète"
              value={formData.adresse}
              onChange={handleChange}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="telephone">Téléphone</Label>
            <Input
              id="telephone"
              name="telephone"
              placeholder="Numéro de téléphone"
              value={formData.telephone}
              onChange={handleChange}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
            />
          </div>
          
          <Button 
            type="submit" 
            className="w-full mt-6 group transition-all"
          >
            <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
            Ajouter le client
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

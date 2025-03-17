import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Plus, Search } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Caisse {
  _id: string;
  soldeInitiale: string;
  soldefinale: string;
  dateOuverture: Date;
}

interface CaisseTableProps {
  caisses: Caisse[]
}

export default function CaisseTable({ 
  caisses, 
  onDeleteCaisse, 
  onEditCaisse,
  onAddCaisse
}: CaisseTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCaisses = caisses.filter(caisse => 
    caisse.soldeInitiale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caisse.soldefinale.toLowerCase().includes(searchTerm.toLowerCase()) ||
    caisse.dateOuverture.includes(searchTerm)
  );

  const handleDelete = (id: string, soldeInitiale: string) => {
    console.log(id)
    //onDeleteCaisse(id);
    toast({
      title: "Caisse supprimée",
      description: `La caisse avec le solde initial ${soldeInitiale} a été supprimée avec succès`,
    });
  };

  return (
    <Card className="w-full glass-panel animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl">Liste des Caisses</CardTitle>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une caisse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-[250px] focus:w-full sm:focus:w-[300px] transition-all duration-300"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-medium">Solde Initiale</TableHead>
                <TableHead className="font-medium">Solde Finale</TableHead>
                <TableHead className="font-medium">Date d'Ouverture</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCaisses.length > 0 ? (
                filteredCaisses.map((caisse) => (
                  <TableRow key={caisse._id} className="group animate-fade-in">
                    <TableCell className="font-medium">{caisse.soldeInitiale}</TableCell>
                    <TableCell>{caisse.soldefinale}</TableCell>
                    <TableCell>{caisse.dateOuverture}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="icon"
                         
                          className="h-8 w-8 transition-all hover:text-primary hover:border-primary"
                        >
                          <Plus className="h-4 w-4" />
                          <span className="sr-only">Ajouter une caisse</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                         
                          className="h-8 w-8 transition-all hover:text-amber-500 hover:border-amber-500"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Modifier</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(caisse._id, caisse.soldeInitiale)}
                          className="h-8 w-8 transition-all hover:text-destructive hover:border-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Supprimer</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucune caisse trouvée
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
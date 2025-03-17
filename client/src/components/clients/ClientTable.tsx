import React, { useState, useMemo } from 'react';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, UserPlus, Search, ChevronLeft, ChevronRight } from 'lucide-react'; // Import icons
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface Client {
  _id: string;
  nom: string;
  adresse: string;
  telephone: string;
}

interface ClientTableProps {
  clients: Client[];
  onDeleteClient: (id: string) => Promise<void>;
  onEditClient: (client: Client) => void;
  onAddToOrder: (client: Client) => void;
}

const clientSchema = Yup.object().shape({
  nom: Yup.string().required('Le nom est requis'),
  adresse: Yup.string().required('L\'adresse est requise'),
  telephone: Yup.string()
    .required('Le numéro de téléphone est requis')
    .matches(/^[0-9]+$/, "Doit contenir uniquement des chiffres")
    .min(10, 'Le numéro de téléphone doit contenir au moins 10 chiffres'),
});

export default function ClientTable({
  clients,
  onDeleteClient,
  onEditClient,
  onAddToOrder
}: ClientTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; nom: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

    const handleEditClick = (client: Client) => {
        setCurrentClient(client);
        setOpenEditModal(true);
    };
    const handleCloseEditModal = () => {
        setOpenEditModal(false);
        setCurrentClient(null)
    }

  const handleDeleteClick = (id: string, nom: string) => {
    setClientToDelete({ id, nom });
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;

    try {
      await onDeleteClient(clientToDelete.id);
      toast({
        title: "Client supprimé",
        description: `${clientToDelete.nom} a été supprimé avec succès.`,
      });
       // Adjust current page if we are on the last page and deleting the last item
      if (displayedClients.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }

    } catch (error:any) {
      toast({
        title: "Erreur de suppression",
        description: `Impossible de supprimer ${clientToDelete.nom}: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setOpenDeleteModal(false);
      setClientToDelete(null);
    }
  };

    const handleCancelDelete = () => {
        setOpenDeleteModal(false);
        setClientToDelete(null);
    }

  const updateClient = async (values: Client) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onEditClient(values);
      toast({
        title: "Client mis à jour",
        description: "Les informations du client ont été mises à jour avec succès.",
      });

    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la mise à jour du client",
        variant: "destructive",
      });
    }

  }



  // --- Pagination Logic ---
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.adresse.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.telephone.includes(searchTerm)
    );
  }, [clients, searchTerm]);

  const displayedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredClients.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredClients, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  // --- End Pagination Logic ---



 return (
    <Card className="w-full glass-panel animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl">Liste des Clients</CardTitle>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
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
                <TableHead className="font-medium">Nom</TableHead>
                <TableHead className="font-medium">Adresse</TableHead>
                <TableHead className="font-medium">Téléphone</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedClients.length > 0 ? (  // Use displayedClients here
                displayedClients.map((client) => (
                  <TableRow key={client._id} className="group animate-fade-in">
                    <TableCell className="font-medium">{client.nom}</TableCell>
                    <TableCell>{client.adresse}</TableCell>
                    <TableCell>{client.telephone}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                         <Button
                          variant="outline"
                          size="icon"
                          onClick={() => onAddToOrder(client)}
                          className="h-8 w-8 transition-all hover:text-primary hover:border-primary"
                         >
                          <UserPlus className="h-4 w-4" />
                           <span className="sr-only">Ajouter à la commande</span>
                         </Button>

                        {/* Edit Dialog */}
                        <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="icon" onClick={() => handleEditClick(client)} className="h-8 w-8">
                                <Edit className="h-4 w-4" />
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                <DialogTitle>Modifier Client</DialogTitle>
                                <DialogDescription>Modifiez les informations du client ici.</DialogDescription>
                                </DialogHeader>
                                <Formik
                                  initialValues={currentClient || { _id: '', nom: '', adresse: '', telephone: '' }}
                                  validationSchema={clientSchema}
                                  onSubmit={(values, { setSubmitting }) => {
                                   updateClient(values as Client).finally(() => setSubmitting(false));
                                   }}
                                  enableReinitialize
                                >
                                 {({ isSubmitting }) => (
                                    <Form className="space-y-4">
                                      <div>
                                        <Label htmlFor="nom">Nom</Label>
                                        <Field as={Input} id="nom" name="nom" />
                                        <ErrorMessage name="nom" component="div" className="text-red-500 text-sm" />
                                      </div>
                                      <div>
                                        <Label htmlFor="adresse">Adresse</Label>
                                        <Field as={Input} id="adresse" name="adresse" />
                                        <ErrorMessage name="adresse" component="div" className="text-red-500 text-sm" />
                                      </div>
                                       <div>
                                        <Label htmlFor="telephone">Téléphone</Label>
                                       <Field as={Input} id="telephone" name="telephone" />
                                        <ErrorMessage name="telephone" component="div" className="text-red-500 text-sm" />
                                     </div>
                                     <DialogFooter>
                                        <Button type="button" variant="outline" onClick={handleCloseEditModal} disabled={isSubmitting}>
                                         Annuler
                                         </Button>
                                         <Button type="submit" disabled={isSubmitting}>
                                           {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                                          </Button>
                                     </DialogFooter>
                                    </Form>
                                  )}
                                 </Formik>
                             </DialogContent>
                         </Dialog>

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={openDeleteModal} onOpenChange={setOpenDeleteModal}>
                            <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDeleteClick(client._id, client.nom)}
                                className="h-8 w-8 transition-all hover:text-destructive hover:border-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                               <span className="sr-only">Supprimer</span>
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Confirmer la suppression</DialogTitle>
                                <DialogDescription>
                                Êtes-vous sûr de vouloir supprimer {clientToDelete?.nom}? Cette action est irréversible.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                                <Button variant="outline" onClick={handleCancelDelete}>Annuler</Button>
                                <Button variant="destructive" onClick={handleConfirmDelete}>Supprimer</Button>
                            </DialogFooter>
                            </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    Aucun client trouvé.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* --- Pagination Controls --- */}
        <div className="flex items-center justify-center mt-4 space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            aria-label="Previous Page" //  ARIA label for screen readers
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
             {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            aria-label="Next Page"  // ARIA label
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {/* --- End Pagination Controls --- */}

      </CardContent>
    </Card>
  );
}
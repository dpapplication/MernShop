import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Trash2, Search, Check, Loader2 } from 'lucide-react'; // Import Loader2
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogTrigger
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"


interface Product {
  _id: string;
  nom: string;
  prix: string;
  stock: string;
}

interface ProductTableProps {
  products: Product[];
  onDeleteProduct: (id: string) => void;
  onEditProduct: (product: Product) => void;
  onSelectProduct: (product: Product) => void;
}

export default function ProductTable({
  products,
  onDeleteProduct,
  onEditProduct,
  onSelectProduct
}: ProductTableProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 4;
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editedProduct, setEditedProduct] = useState<Product | null>(null);
  const [isSaving, setIsSaving] = useState(false); // Loading state for save


  // Use useMemo for filteredProducts
  const filteredProducts = useMemo(() => {
    return products.filter(product =>
      product.nom.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);


  const totalPages = Math.ceil(filteredProducts.length / rowsPerPage);

  // Use useMemo for paginatedProducts
  const paginatedProducts = useMemo(() => {
      const startIndex = (currentPage - 1) * rowsPerPage;
      return filteredProducts.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredProducts, currentPage, rowsPerPage]);

  const handlePageChange = (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
  };

    const handleOpenEditDialog = (product: Product) => {
      setEditedProduct(product);  // Set the product to be edited
      setOpenEditDialog(true);      // Open the dialog
    };
     const handleCloseEditDialog = () => {
        setOpenEditDialog(false);    // Close the dialog
        setEditedProduct(null);   // Clear the edited product
    };
      const handleSaveEdit = async () => { // Make this async
          if (editedProduct) {
            setIsSaving(true); // Set loading state to true
            try {
                await onEditProduct(editedProduct); // Await the onEditProduct call
                
             } catch (error) {
                console.error("Error saving edits:", error);
            } finally {
                 setIsSaving(false); // Set loading state to false
            }

          }
        };

    const handleInputChange = (field: keyof Product, value: string) => {
    setEditedProduct(prevProduct => {
      if (!prevProduct) return null;
      return {
        ...prevProduct,
        [field]: value,
      };
    });
  };



  const handleDelete = (id: string, nom: string) => {
    onDeleteProduct(id);
    toast({
      title: "Produit supprimé",
      description: `${nom} a été supprimé avec succès`,
    });
     // Adjust current page if we are on the last page and deleting the last item
    if(paginatedProducts.length === 1 && currentPage > 1){
        setCurrentPage(currentPage - 1)
    }
  };

  const handleSelect = (product: Product) => {
    onSelectProduct(product);
    toast({
      title: "Produit sélectionné",
      description: `${product.nom} a été ajouté à la commande`,
    });
  };

  return (
    <>
    <Card className="w-full glass-panel animate-fade-in">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl">Liste des Produits</CardTitle>
          <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un produit..."
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
                <TableHead className="font-medium">Produit</TableHead>
                <TableHead className="font-medium text-right">Prix</TableHead>
                <TableHead className="font-medium text-right">Stock</TableHead>
                <TableHead className="font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <TableRow key={product._id} className="group animate-fade-in">
                    <TableCell className="font-medium">{product.nom}</TableCell>
                    <TableCell className="text-right">{product.prix} €</TableCell>
                    <TableCell className="text-right">{product.stock}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleSelect(product)}
                          className="h-8 w-8 transition-all hover:text-primary hover:border-primary"
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Sélectionner</span>
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleOpenEditDialog(product)}  // Open dialog on edit click
                            className="h-8 w-8 transition-all hover:text-amber-500 hover:border-amber-500"
                        >
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Modifier</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(product._id, product.nom)}
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
                    Aucun produit trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    isActive={currentPage === page}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </CardContent>
    </Card>

    <Dialog open={openEditDialog} onOpenChange={setOpenEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le produit</DialogTitle>
            <DialogDescription>
              Effectuez vos modifications et cliquez sur "Enregistrer".
            </DialogDescription>
          </DialogHeader>
            {editedProduct &&(
                <div className="space-y-4 py-2 pb-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom</Label>
                  <Input
                    id="nom"
                    value={editedProduct.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}

                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prix">Prix</Label>
                  <Input
                    id="prix"
                    value={editedProduct.prix}
                    onChange={(e) => handleInputChange('prix', e.target.value)}

                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input
                    id="stock"
                    value={editedProduct.stock}
                    onChange={(e) => handleInputChange('stock', e.target.value)}

                  />
                </div>
              </div>

            )}
          <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={handleCloseEditDialog}>Annuler</Button>
            </DialogClose>
            <Button
                type="submit"
               
                onClick={handleSaveEdit}
                disabled={isSaving} // Disable the button while saving
                >
                {isSaving ? (
                    <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                    </>
                ) : (
                    "Enregistrer"
                )}
                </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </>
  );
}
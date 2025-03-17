import { useState, useEffect, useCallback } from 'react'; // Import useCallback
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductForm from '@/components/products/ProductForm';
import ProductTable from '@/components/products/ProductTable';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/utils/axiosInstance';
interface Product {
    _id: string;
    nom: string;
    prix: string;
    stock: string;
}
const Commande = () => {
    const { toast } = useToast(); 
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const fetchProducts = useCallback(async () => {
        try {
            const response = await axiosInstance.get<Product[]>("api/produits/");
            setProducts(response.data);
        } catch (error) {
            console.error("Erreur lors de la récupération des produits :", error);
            toast({
                title: "Erreur",
                description: "Impossible de récupérer les produits.",
                variant: "destructive"
            });
        }
    }, []); 

    // Initial data fetch
    useEffect(() => {
      
        fetchProducts();
    }, [ fetchProducts]);



    const handleAddProduct = async (product: Product) => {
        try {
            const response = await axiosInstance.post<Product>("/api/produits/", product);
            setProducts([...products, response.data]);
            toast({ title: "Produit ajouté", description: `Le produit ${product.nom} a été ajouté.` });
        } catch (error) {
            console.error("Erreur lors de l'ajout du produit :", error);
            toast({ title: "Erreur", description: "Impossible d'ajouter le produit.", variant: "destructive" });
        }
    };

    const handleDeleteProduct = async (id: string) => {
        try {
            await axiosInstance.delete(`api/produits/${id}`);
            setProducts(products.filter(p => p._id !== id));
            toast({ title: "Produit supprimé", description: "Le produit a été supprimé." });
        } catch (error) {
            console.error("Erreur lors de la suppression du produit :", error);
            toast({ title: "Erreur", description: "Impossible de supprimer le produit.", variant: "destructive" });
        }
    };

    const handleEditProduct = async (updatedProduct: Product) => {
      try {
          await axiosInstance.put(`api/produits/${updatedProduct._id}`, updatedProduct);
          setProducts(products.map(p => p._id === updatedProduct._id ? updatedProduct : p)); //Update State
          toast({ title: "Produit modifié", description: `Le Produit ${updatedProduct.nom} a été modifié.` });

      } catch (error: any) {
          console.error("Erreur lors de la modification du Produit:", error);
          toast({ title: "Erreur de modification", description: error.message, variant: "destructive" });
      }
    };

    const handleSelectProduct = (product: Product) => {
        setSelectedProduct(product);
    };

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <Header />

            <main className="flex-1 container py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                    <ProductForm onProductAdded={handleAddProduct}  onProductUpdated={handleEditProduct} selectedProduct={selectedProduct}/>
                    <ProductTable
                        products={products}
                        onDeleteProduct={handleDeleteProduct}
                        onEditProduct={handleEditProduct}
                        onSelectProduct={handleSelectProduct}
                    />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Commande;
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '@/components/layout/Header';
import axiosInstance from '@/utils/axiosInstance';
import { XCircle, PlusCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

// --- Interfaces ---

interface Product {
    _id: string;
    nom: string;
    prix: number;
    stock: number;
    categorie: string;
}

interface Service {
    _id: string;
    nom: string;
    prix: number;
}
// Interface pour le client, si elle n'existe pas déjà
interface Client {
    _id: string;
    nom: string;
    adresse: string;
    telephone: string;
}

interface OrderItem {
    type: 'product' | 'service';
    item: Product | Service;
    quantity: number;
    discount: number;
    customPrice: number;
}

interface Order {
    _id: string;
    client: Client; // Utiliser l'interface Client
    produits: {
        produit: Product;
        quantite: number;
        remise: number;
        customPrice: number;
    }[];
    services: {
        service: Service;
        remise: number;
        customPrice: number;
    }[];
    remiseGlobale?: number;
    date: string;
    status: boolean;
}

// --- Component ---

const OrderEditPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { id } = useParams(); // Get order ID from URL

    // --- State ---
    const [order, setOrder] = useState<Order | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
    const [globalDiscount, setGlobalDiscount] = useState<number>(0);
    const [loading, setLoading] = useState(true);
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [dialogQuantity, setDialogQuantity] = useState<number>(1);
    const [dialogDiscount, setDialogDiscount] = useState<number>(0);
    const [dialogCustomPrice, setDialogCustomPrice] = useState<number>(0);

    // --- Data Fetching ---

    // Fetch order details
    const fetchOrder = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get<Order>(`api/commandes/${id}`);
            setOrder(response.data);

            // Transform order data to unified OrderItem format
            const transformedOrderItems: OrderItem[] = [];
            response.data.produits.forEach((p) => {
                transformedOrderItems.push({
                    type: 'product',
                    item: p.produit,
                    quantity: p.quantite,
                    discount: p.remise,
                    customPrice: p.customPrice,
                });
            });
            response.data.services.forEach((s) => {
                transformedOrderItems.push({
                    type: 'service',
                    item: s.service,
                    quantity: 1,
                    discount: s.remise,
                    customPrice: s.customPrice,
                });
            });
            setOrderItems(transformedOrderItems);
            setGlobalDiscount(response.data.remiseGlobale || 0);
        } catch (error) {
            console.error('Error fetching order:', error);
            toast({ title: 'Erreur', description: 'Impossible de charger la commande.', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [id, toast]);

    // Fetch all products and services
    const fetchProductsAndServices = useCallback(async () => {
        try {
            const [productsResponse, servicesResponse] = await Promise.all([
                axiosInstance.get<Product[]>('api/produits'),
                axiosInstance.get<Service[]>('api/services'),
            ]);
            setProducts(productsResponse.data);
            setServices(servicesResponse.data);
        } catch (error) {
            console.error('Error fetching products and services:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les produits et services.',
                variant: 'destructive',
            });
        }
    }, [toast]);

    useEffect(() => {
        fetchOrder();
        fetchProductsAndServices();
    }, [fetchOrder, fetchProductsAndServices]);

    // --- Helper Functions ---

    const addItemToOrder = useCallback(() => {
        const item = selectedProduct || selectedService;
        if (!item) return;
    
        const type = selectedProduct ? 'product' : 'service';
        const existingItemIndex = orderItems.findIndex(
            (orderItem) => orderItem.item._id === item._id && orderItem.type === type
        );
    
        if (existingItemIndex > -1) {
            // Item exists, update it
            const updatedOrderItems = [...orderItems];
            const existingItem = updatedOrderItems[existingItemIndex];
    
            updatedOrderItems[existingItemIndex] = {
                ...existingItem,
                quantity: type === 'product' ? (existingItem.quantity || 0) + dialogQuantity : 1, // Increment quantity if product
                discount: dialogDiscount,
                customPrice: dialogCustomPrice,
            };
            setOrderItems(updatedOrderItems);
        } else {
            // New item
            const newOrderItem: OrderItem = {
                type,
                item,
                quantity: type === 'product' ? dialogQuantity : 1,
                discount: dialogDiscount,
                customPrice: dialogCustomPrice,
            };
            setOrderItems([...orderItems, newOrderItem]);
        }
    
        // Reset dialog states
        setIsProductDialogOpen(false);
        setIsServiceDialogOpen(false);
        setSelectedProduct(null);
        setSelectedService(null);
        setDialogQuantity(1);
        setDialogDiscount(0);
        setDialogCustomPrice(0);
    
    }, [orderItems, selectedProduct, selectedService, dialogQuantity, dialogDiscount, dialogCustomPrice]); // Dependencies for useCallback

    const handleRemoveItem = (itemId: string, type: 'product' | 'service') => {
        setOrderItems(orderItems.filter((item) => !(item.item._id === itemId && item.type === type)));
    };

    const handleUpdateItem = (itemId: string, type: 'product' | 'service', updates: Partial<OrderItem>) => {
        setOrderItems(
            orderItems.map((item) =>
                item.item._id === itemId && item.type === type ? { ...item, ...updates } : item
            )
        );
    };

    const calculateSubtotal = () => {
        return orderItems.reduce((total, orderItem) => {
            const price = orderItem.customPrice;
            const discountMultiplier = 1 - orderItem.discount / 100;
            const quantity = orderItem.quantity || 1;
            return total + price * quantity * discountMultiplier;
        }, 0);
    };

    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal * (1 - globalDiscount / 100);
    };

    // --- Event Handlers ---

    const handleOpenProductDialog = (product: Product) => {
        setSelectedProduct(product);
        setDialogQuantity(1);
        setDialogDiscount(0);
        setDialogCustomPrice(product.prix);
        setIsProductDialogOpen(true);
    };

    const handleOpenServiceDialog = (service: Service) => {
        setSelectedService(service);
        setDialogDiscount(0);
        setDialogCustomPrice(service.prix);
        setIsServiceDialogOpen(true);
    };

        const handleUpdateOrder = async () => {
           if (!order) return;

            if(globalDiscount < 0){
                 toast({ title: 'Erreur', description: 'La remise ne peut pas être négative.', variant: 'destructive' });
                return;
            }

            const updatedOrderData = {
                client: order.client._id, // Keep the same client
                produits: orderItems
                    .filter((item) => item.type === 'product')
                    .map((item) => ({
                        produit: item.item._id,
                        quantite: item.quantity,
                        remise: item.discount,
                        customPrice: item.customPrice,
                    })),
                services: orderItems
                    .filter((item) => item.type === 'service')
                    .map((item) => ({
                        service: item.item._id,
                        remise: item.discount,
                        customPrice: item.customPrice,
                    })),
                remiseGlobale: globalDiscount,
            };


        try {
            const response = await axiosInstance.put(`api/commandes/${order._id}`, updatedOrderData);
            if (response.status === 200) {
                toast({ title: 'Succès', description: 'Commande mise à jour avec succès.' });
                navigate(`/orders`); // back to the order list
            } else {
                toast({ title: 'Erreur', description: 'Erreur lors de la mise à jour de la commande.', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast({
                title: 'Erreur',
                description: "Une erreur s'est produite lors de la mise à jour de la commande.",
                variant: 'destructive',
            });
        }
    };


    // --- Filtered Products and Services (for the selection lists) ---

    const filteredProducts = products.filter((product) =>
        product.nom.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    const filteredServices = services.filter((service) =>
        service.nom.toLowerCase().includes(serviceSearchTerm.toLowerCase())
    );

    // --- JSX Rendering ---

    if (loading) {
        return <div>Chargement...</div>;
    }

    if (!order) {
        return <div>Commande introuvable.</div>;
    }

    return (
        <>
            <Header />
            <div className="container py-8">
                <h1 className="text-3xl font-semibold mb-6">Modifier la Commande #{order._id}</h1>
                  <h2 className="text-2xl  mb-6">Client: {order.client.nom}</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Product Selection (Keep Add Product button) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ajouter des Produits</CardTitle>
                            <Input
                                placeholder="Rechercher un produit..."
                                value={productSearchTerm}
                                onChange={(e) => setProductSearchTerm(e.target.value)}
                                className="mt-2"
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <div
                                            key={product._id}
                                            className="p-2 border rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                            onClick={() => handleOpenProductDialog(product)}
                                        >
                                            <span>{product.nom} ({product.stock} en stock)</span>
                                            <span className="text-sm text-gray-500">{formatCurrency(product.prix)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>Aucun produit trouvé.</p>
                                )}
                            </div>
                            <Button variant="outline" asChild className="mt-2 w-full">
                                <Link to="/products/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Produit
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Service Selection (Keep Add Service button) */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ajouter des Services</CardTitle>
                            <Input
                                placeholder="Rechercher un service..."
                                value={serviceSearchTerm}
                                onChange={(e) => setServiceSearchTerm(e.target.value)}
                                className="mt-2"
                            />
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                {filteredServices.length > 0 ? (
                                    filteredServices.map((service) => (
                                        <div
                                            key={service._id}
                                            className="p-2 border rounded-md cursor-pointer hover:bg-gray-100 flex items-center justify-between"
                                            onClick={() => handleOpenServiceDialog(service)}
                                        >
                                            <span>{service.nom}</span>
                                           <span className="text-sm text-gray-500">{formatCurrency(service.prix)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>Aucun service trouvé.</p>
                                )}
                            </div>
                            <Button variant="outline" asChild className="mt-2 w-full">
                                <Link to="/services/new">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Service
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Order Items Table */}
                {orderItems.length > 0 && (
                    <Card className="mt-6">
                        <CardHeader><CardTitle>Articles de la Commande</CardTitle></CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Nom</TableHead>
                                            <TableHead className="text-right">Quantité</TableHead>
                                            <TableHead className="text-right">Prix Unitaire</TableHead>
                                            <TableHead className="text-right">Remise (%)</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {orderItems.map((item) => (
                                            <TableRow key={`${item.type}-${item.item._id}`}>
                                                <TableCell>{item.type === 'product' ? 'Produit' : 'Service'}</TableCell>
                                                <TableCell>{item.item.nom}</TableCell>
                                                <TableCell className="text-right">
                                                    {item.type === 'product' && (
                                                        <Input
                                                            type="number"
                                                            min="1"
                                                            value={item.quantity}
                                                            onChange={(e) =>
                                                                handleUpdateItem(item.item._id, item.type, {
                                                                    quantity: parseInt(e.target.value, 10),
                                                                })
                                                            }
                                                            className="w-20 text-right"
                                                        />
                                                    )}
                                                    {item.type === 'service' && <span>-</span>}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        value={item.customPrice}
                                                        onChange={(e) =>
                                                            handleUpdateItem(item.item._id, item.type, {
                                                                customPrice: parseFloat(e.target.value),
                                                            })
                                                        }
                                                        className="w-24 text-right"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={item.discount}
                                                        onChange={(e) =>
                                                            handleUpdateItem(item.item._id, item.type, {
                                                                discount: parseInt(e.target.value, 10),
                                                            })
                                                        }
                                                        className="w-20 text-right"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                   {formatCurrency(item.customPrice * (item.quantity || 1) * (1 - item.discount / 100))}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        onClick={() => handleRemoveItem(item.item._id, item.type)}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Order Summary */}
                <Card className="mt-6">
                    <CardHeader><CardTitle>Récapitulatif de la Commande</CardTitle></CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span>Sous-total:</span>
                                 <span>{formatCurrency(calculateSubtotal())}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <Label htmlFor="global-discount">Remise Globale (%):</Label>
                                <Input
                                    id="global-discount"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={globalDiscount}
                                    onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                                    className="w-20 text-right"
                                />
                            </div>
                            <div className="border-t pt-2 mt-2 flex justify-between font-bold">
                                <span>Total:</span>
                                 <span>{formatCurrency(calculateGrandTotal())}</span>
                            </div>
                            <Button className="mt-4 w-full" onClick={handleUpdateOrder}>
                                Mettre à Jour la Commande
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Product Selection Dialog */}
                <AlertDialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Ajouter un Produit</AlertDialogTitle>
                            <AlertDialogDescription>
                                {selectedProduct && (
                                    <>
                                        <p>Produit: {selectedProduct.nom}</p>
                                         <p>Prix initial: {formatCurrency(selectedProduct.prix)}</p>
                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div className="grid grid-cols-3 items-center gap-4">
                                                <Label htmlFor="dialog-quantity" className="text-right">
                                                    Quantité
                                                </Label>
                                                <Input
                                                    id="dialog-quantity"
                                                    type="number"
                                                    min="1"
                                                    value={dialogQuantity}
                                                    onChange={(e) => setDialogQuantity(Math.max(1, parseInt(e.target.value, 10)))}
                                                    className="col-span-2 w-20"
                                                />
                                            </div>
                                            <div>
                                                <div className="grid grid-cols-3 items-center gap-4">
                                                    <Label htmlFor="dialog-discount" className="text-right">
                                                        Remise (%)
                                                    </Label>
                                                    <Input
                                                        id="dialog-discount"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={dialogDiscount}
                                                        onChange={(e) => setDialogDiscount(Math.max(0, parseInt(e.target.value, 10)))}
                                                        className="col-span-2 w-20"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="grid grid-cols-3 items-center gap-4">
                                                    <Label htmlFor="dialog-custom-price" className="text-right">
                                                        Prix
                                                    </Label>
                                                    <Input
                                                        id="dialog-custom-price"
                                                        type="number"
                                                        min="0"
                                                        value={dialogCustomPrice}
                                                        onChange={(e) => setDialogCustomPrice(Math.max(0, parseFloat(e.target.value)))}
                                                        className="col-span-2 w-32"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={addItemToOrder}>
                                Ajouter
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Service Selection Dialog */}
                <AlertDialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Ajouter un Service</AlertDialogTitle>
                        <AlertDialogDescription>
                                {selectedService && (
                                    <>
                                        <p>Service: {selectedService.nom}</p>
                                        <p>Prix initial: {formatCurrency(selectedService.prix)}</p>
                                        <div className="grid gap-4 mt-4">
                                            <div>
                                                <div className="grid grid-cols-3 items-center gap-4">
                                                    <Label htmlFor="dialog-discount-s" className="text-right">
                                                        Remise (%)
                                                    </Label>
                                                    <Input
                                                        id="dialog-discount-s"
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={dialogDiscount}
                                                        onChange={(e) => setDialogDiscount(Math.max(0, parseInt(e.target.value, 10)))}
                                                        className="col-span-2 w-20"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="grid grid-cols-3 items-center gap-4">
                                                    <Label htmlFor="dialog-custom-price-s" className="text-right">
                                                        Prix
                                                    </Label>
                                                    <Input
                                                        id="dialog-custom-price-s"
                                                        type="number"
                                                        min="0"
                                                        value={dialogCustomPrice}
                                                        onChange={(e) => setDialogCustomPrice(Math.max(0, parseFloat(e.target.value)))}
                                                        className="col-span-2 w-32"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction onClick={addItemToOrder}>Ajouter</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </>
    );
};

export default OrderEditPage;
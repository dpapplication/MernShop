import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import axiosInstance from '@/utils/axiosInstance';
import { CheckCircle, XCircle, PlusCircle } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Link } from 'react-router-dom';

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

interface Client {
    _id: string;
    nom: string;
    adresse: string;
    telephone: string;
}

// Unified OrderItem interface
interface OrderItem {
    type: 'product' | 'service';
    item: Product | Service;
    quantity: number; // Optional, defaults to 1 if undefined
    discount: number;
    prix: number;
}

// --- Component ---

const OrderNewPage = () => {
    const { toast } = useToast();
    const navigate = useNavigate();

    // --- State ---
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<string>('');
    const [orderItems, setOrderItems] = useState<OrderItem[]>([]); // Unified order items
    const [globalDiscount, setGlobalDiscount] = useState<number>(0);
    const [loading, setLoading] = useState(true);  // General loading state
    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [serviceSearchTerm, setServiceSearchTerm] = useState('');

    // Dialog states
    const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [dialogQuantity, setDialogQuantity] = useState<number>(1);
    const [dialogDiscount, setDialogDiscount] = useState<number>(0);
    const [dialogprix, setDialogprix] = useState<number>(0);

    // --- Data Fetching (Combined) ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [productsResponse, servicesResponse, clientsResponse] = await Promise.all([
                    axiosInstance.get<Product[]>('api/produits'),
                    axiosInstance.get<Service[]>('api/services'),
                    axiosInstance.get<Client[]>('api/clients'),
                ]);
                setProducts(productsResponse.data);
                setServices(servicesResponse.data);
                setClients(clientsResponse.data);
            } catch (error) {
                console.error('Error fetching data:', error);
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger les données.',
                    variant: 'destructive',
                });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [toast]);  // Only re-run if toast changes (unlikely, but good practice)

    // --- Helper Functions ---

    // Add item to order (handles both products and services)
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
            prix: dialogprix,
        };
        setOrderItems(updatedOrderItems);
    } else {
        // New item
        const newOrderItem: OrderItem = {
            type,
            item,
            quantity: type === 'product' ? dialogQuantity : 1,
            discount: dialogDiscount,
            prix: dialogprix,
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
    setDialogprix(0);

}, [orderItems, selectedProduct, selectedService, dialogQuantity, dialogDiscount, dialogprix]); // Dependencies for useCallback


    const handleRemoveItem = (itemId: string, type: 'product' | 'service') => {
        setOrderItems(orderItems.filter((item) => !(item.item._id === itemId && item.type === type)));
    };

    // Update an item's properties (quantity, discount, prix)
    const handleUpdateItem = (itemId: string, type: 'product' | 'service', updates: Partial<OrderItem>) => {
        setOrderItems(
            orderItems.map((item) =>
                item.item._id === itemId && item.type === type ? { ...item, ...updates } : item
            )
        );
    };

    // Calculate the subtotal of all items in the order
    const calculateSubtotal = () => {
        return orderItems.reduce((total, orderItem) => {
            const price = orderItem.prix;
            const discountMultiplier = 1 - orderItem.discount / 100;
            const quantity = orderItem.quantity || 1; // Default to 1 if undefined (for services)
            return total + price * quantity * discountMultiplier;
        }, 0);
    };

    // Calculate the grand total, including the global discount
    const calculateGrandTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal * (1 - globalDiscount / 100);
    };

    // --- Event Handlers ---

    const handleOpenProductDialog = (product: Product) => {
        setSelectedProduct(product);
        setDialogQuantity(1); // Reset quantity
        setDialogDiscount(0);
        setDialogprix(product.prix); // Initialize with product's price
        setIsProductDialogOpen(true);
    };

    const handleOpenServiceDialog = (service: Service) => {
        setSelectedService(service);
        setDialogDiscount(0);
        setDialogprix(service.prix);
        setIsServiceDialogOpen(true);
    };


    const handleCreateOrder = async () => {
        if (!selectedClient) {
            toast({ title: 'Erreur', description: 'Veuillez sélectionner un client.', variant: 'destructive' });
            return;
        }

        if(globalDiscount < 0){
            toast({ title: 'Erreur', description: 'La remise ne peut pas être négative.', variant: 'destructive' });
            return;
        }


        // Prepare order data for the API request
        const orderData = {
            clientId: selectedClient,
            produits: orderItems
                .filter((item) => item.type === 'product')
                .map((item) => ({
                    produit: item.item._id,
                    quantite: item.quantity,
                    remise: item.discount,
                    prix: item.prix,
                })),
            services: orderItems
                .filter((item) => item.type === 'service')
                .map((item) => ({
                    service: item.item._id,
                    remise: item.discount,
                    prix: item.prix,
                })),
            remiseGlobale: globalDiscount,
        };

        try {
            const response = await axiosInstance.post('api/commandes', orderData);
            
            if (response.status === 201) {
                const newOrderId = response.data._id;
                toast({ title: 'Succès', description: 'Commande créée avec succès.' });
                navigate(`/orders/${newOrderId}/payments`); // Go to payments
            } else {
                toast({ title: 'Erreur', description: 'Erreur lors de la création de la commande.', variant: 'destructive' });
            }
        } catch (error) {
            console.error('Error creating order:', error);
            toast({ title: 'Erreur', description: "Une erreur s'est produite lors de la création de la commande.", variant: 'destructive' });
        }
    };

    // --- Filtered Products and Services ---

    const filteredProducts = products.filter((product) =>
        product.nom.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    const filteredServices = services.filter((service) =>
        service.nom.toLowerCase().includes(serviceSearchTerm.toLowerCase())
    );


    // --- JSX Rendering ---

    return (
        <>
            <Header />
            <div className="container py-8">
                <h1 className="text-3xl font-semibold mb-6">Nouvelle Commande</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Client Selection */}
                    <Card>
                        <CardHeader><CardTitle>Sélectionner un Client</CardTitle></CardHeader>
                        <CardContent>
                            <Select onValueChange={setSelectedClient} value={selectedClient}>
                                <SelectTrigger><SelectValue placeholder="Choisir un client" /></SelectTrigger>
                                <SelectContent>
                                    {clients.map((client) => (
                                        <SelectItem key={client._id} value={client._id}>{client.nom}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button variant="outline" asChild className="mt-2 w-full">
                                <Link to="/clients">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Client
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Product Selection */}
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
                                            <span className="text-sm text-gray-500">{product.prix.toFixed(2)} €</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>Aucun produit trouvé.</p>
                                )}
                            </div>
                            <Button variant="outline" asChild className="mt-2 w-full">
                                <Link to="/produits">
                                    <PlusCircle className="mr-2 h-4 w-4" /> Ajouter Produit
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Service Selection */}
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
                                            <span className="text-sm text-gray-500">{service.prix.toFixed(2)} €</span>
                                        </div>
                                    ))
                                ) : (
                                    <p>Aucun service trouvé.</p>
                                )}
                            </div>
                            <Button variant="outline" asChild className="mt-2 w-full">
                                <Link to="/service">
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
                                                        value={item.prix}
                                                        onChange={(e) =>
                                                            handleUpdateItem(item.item._id, item.type, {
                                                                prix: parseFloat(e.target.value),
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
                                                    {(item.prix * (item.quantity || 1) * (1 - item.discount / 100)).toFixed(2)} €
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
                                <span>{calculateSubtotal().toFixed(2)} €</span>
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
                                <span>{calculateGrandTotal().toFixed(2)} €</span>
                            </div>
                            <Button className="mt-4 w-full" onClick={handleCreateOrder}>
                                Créer la Commande et Ajouter un Paiement
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
                                        <p>Produit:  {selectedProduct.nom}</p>
                                        <p>Prix initial: {selectedProduct.prix.toFixed(2)} €</p>
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
                                                        value={dialogprix}
                                                        onChange={(e) => setDialogprix(Math.max(0, parseFloat(e.target.value)))}
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
                                        <p>Prix initial: {selectedService.prix.toFixed(2)} €</p>
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
                                                        value={dialogprix}
                                                        onChange={(e) => setDialogprix(Math.max(0, parseFloat(e.target.value)))}
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

export default OrderNewPage;
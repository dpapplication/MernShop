import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Input, Label } from '@/components/ui/index';
import { useToast } from "@/components/ui/use-toast"
import axiosInstance from '@/utils/axiosInstance';
import {
    PlusCircle, User, ShoppingBag,
    CreditCard, ChevronRight, ChevronLeft, Trash2, MinusCircle
} from 'lucide-react';

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import Header from '@/components/layout/Header';

// --- Shadcn UI Select and Table Imports ---
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { v4 as uuidv4 } from 'uuid';
import { Link } from 'react-router-dom'; // Import Link


// --- Interfaces ---
interface Order {
    _id?: string;  // Optional for new orders.
    client?: {
        _id: string;
        nom: string;
        adresse: string;
        telephone: string;
    };
    produits?: {
        _id: string;
        produit: {
            _id: string;
            nom: string;
            prix: number | string;
            stock: number;
        };
        quantite: string;
        remise: string;
    }[];
    remiseGlobale?: string; // Keep remiseGlobale
    createdAt?: string;
}

interface Client {
    _id: string;
    nom: string;
    adresse: string;
    telephone: string
}

interface Product {
    _id: string;
    nom: string;
    prix: number | string;
    stock: number;
}

// --- Helper Functions ---
const formatCurrency = (value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) {
        return "Invalid Input";
    }
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numValue);
};

const calculateOrderSubtotal = (orderItems?: Order['produits']) => {
    if (!orderItems) return 0;

    return orderItems.reduce((total, item) => {
        const price = parseFloat(item.produit.prix.toString());
        const quantity = parseInt(item.quantite, 10);
        const discount = parseFloat(item.remise) || 0;
        return total + (price * quantity - discount);
    }, 0)
}


const calculateTotalDue = (orderItems: Order['produits'], globalDiscount: string = '0'): string => { //Removed payments
    const subtotal = calculateOrderSubtotal(orderItems);
    const discount = parseFloat(globalDiscount) || 0;
    const discountedSubtotal = subtotal - discount;
    return discountedSubtotal.toFixed(2); //Simplified
};


// --- Component ---
const NewOrderPage: React.FC = () => {
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order>({
        produits: [],
    });

    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const { toast } = useToast();


    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 2; // Only 2 steps now

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');

    // --- State for New Product ---
    const [newProduct, setNewProduct] = useState<{ productId: string; quantity: string; discount: string, prix: string }>({
        productId: '',
        quantity: '',
        discount: '',
        prix: ''
    });

    // --- Fetch Clients and Products ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [clientsResponse, productsResponse] = await Promise.all([
                    axiosInstance.get<Client[]>(`api/clients`),
                    axiosInstance.get<Product[]>(`api/produits`),
                ]);
                setClients(clientsResponse.data);
                setProducts(productsResponse.data);
            } catch (error) {
                console.error("Error fetching data:", error);
                toast({
                    title: "Error",
                    description: "Failed to fetch client or product data.",
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [toast]);

    // --- Input Change Handlers ---

    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        productId?: string,
        field?: string
    ) => {
        const { name, value } = event.target;
        const numValue = parseInt(value, 10);


        if (productId && field) {
            setOrder((prevOrder) => {
                if (!prevOrder?.produits) return prevOrder;

                const productIndex = prevOrder.produits.findIndex(p => p._id === productId);
                if (productIndex === -1) return prevOrder; // Product not found

                const updatedProduits = [...prevOrder.produits]; // Create a copy

                if (field === 'quantite') {
                    // Find in products, NOT in the current order.
                    const selectedProduct = products.find(p => p._id === updatedProduits[productIndex].produit._id);

                    if (selectedProduct && !isNaN(numValue) && numValue > selectedProduct.stock) {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: `Quantity cannot exceed available stock (${selectedProduct.stock}).`,
                        });
                        return prevOrder;
                    }
                    updatedProduits[productIndex] = { ...updatedProduits[productIndex], quantite: value, };
                } else if (field === 'remise') {

                    updatedProduits[productIndex] = { ...updatedProduits[productIndex], [field]: value };
                }

                return { ...prevOrder, produits: updatedProduits };
            });
        } else {
            setOrder((prevOrder) => ({
                ...prevOrder,
                ...(name === 'remiseGlobale' ? { [name]: value } : {
                    client: {
                        ...prevOrder?.client,
                        [name]: value
                    }
                })
            }));
        }
    };


    const handleClientChange = (value: string) => {
        const selectedClient = clients.find((c) => c._id === value);

        setOrder((prevOrder) => ({
            ...prevOrder,  // Always spread the previous state
            client: selectedClient
                ? {
                    _id: selectedClient._id,
                    nom: selectedClient.nom,
                    adresse: selectedClient.adresse || '',
                    telephone: selectedClient.telephone || ''
                }
                : undefined,  // Allow unsetting.
        }));
    };

    const handleNewProductChange = (field: 'productId' | 'quantity' | 'discount' | 'prix', value: string) => {
        if (field === 'quantity' && newProduct.productId) {
            const selectedProduct = products.find((p) => p._id === newProduct.productId);
            const numValue = parseInt(value, 10);
            if (selectedProduct && !isNaN(numValue) && numValue > selectedProduct.stock) {
                // Show an error message if quantity exceeds stock
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: `Quantity cannot exceed available stock (${selectedProduct.stock}).`,
                });
                return;  // Prevent updating the state
            }
        }

        if (field === 'productId') {
            // Find the selected product
            const selectedProduct = products.find((product) => product._id === value);
            if (selectedProduct) {
                // Update the state with the product price and other details
                setNewProduct((prev) => ({
                    ...prev,
                    productId: value,
                    prix: selectedProduct.prix.toString(), // Keep price as string
                }));
            }
            return; // Exit early, no need for further processing.
        }


        setNewProduct((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    // Handle product deletion
    const handleDeleteProduct = (productId: string) => {
        setOrder((prevOrder) => {
            if (!prevOrder?.produits) return prevOrder;
            const updatedProduits = prevOrder.produits.filter((p) => p._id !== productId); // Use the correct ID
            return { ...prevOrder, produits: updatedProduits };
        });
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product) =>
            product.nom.toLowerCase().includes(productSearchTerm.toLowerCase())
        );
    }, [products, productSearchTerm]);

    const filteredClients = useMemo(() => {
        return clients.filter((client) =>
            client.nom.toLowerCase().includes(clientSearchTerm.toLowerCase())
        );
    }, [clients, clientSearchTerm]);


    const handleAddProduct = () => {
        if (!newProduct.productId || !newProduct.quantity) {
            toast({ variant: 'destructive', title: 'Error', description: 'Product and quantity are required.' });
            return;
        }

        const selectedProduct = products.find((p) => p._id === newProduct.productId);
        if (!selectedProduct) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected product not found.', });
            return;
        }

        const quantity = parseInt(newProduct.quantity, 10);
        if (isNaN(quantity) || quantity > selectedProduct.stock) {
            toast({ variant: 'destructive', title: 'Error', description: `Quantity cannot exceed available stock (${selectedProduct.stock}).` });
            return;
        }


        if (order.produits?.some((item) => item.produit._id === newProduct.productId)) {
            toast({ variant: 'destructive', title: 'Error', description: 'Product already in order.', });
            return;
        }
        const productToAdd = {
            _id: uuidv4(),
            produit: {
                _id: selectedProduct._id,
                nom: selectedProduct.nom,
                prix: selectedProduct.prix,
                stock: selectedProduct.stock
            },
            quantite: newProduct.quantity,
            remise: newProduct.discount || '0',
        };

        setOrder((prevOrder) => ({
            ...prevOrder,
            produits: [...(prevOrder.produits || []), productToAdd],
        }));

        setNewProduct({
            productId: '',
            quantity: '',
            discount: '',
            prix: ''
        });
        setProductSearchTerm("");  //Good practice

    };



    // --- Navigation ---
    const goToNextStep = () => {
        // Validate before moving to the next step
        if (currentStep === 1 && !order.client) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please select a client.' });
            return;  // Stop!
        }
        setCurrentStep((prevStep) => Math.min(prevStep + 1, totalSteps));
    };

    const goToPreviousStep = () => {
        setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));
    };
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (currentStep !== totalSteps) { return; }

        const produits = order.produits.map(e => ({ produit: e.produit._id, prix: e.produit.prix, quantite: e.quantite, remise: e.remise }))
        try {

            const response = await axiosInstance.post(`api/commandes`,
                { clientId: order.client._id, produits: produits, remiseGlobale: order.remiseGlobale }

            );
            navigate(`/orders/${response.data._id}/payments`); // Navigate to Payments Page

        } catch (error) {
            console.error("Error creating order:", error);
            toast({
                title: "Error",
                description: "Failed to create order.",
                variant: "destructive"
            });
        }
    };




    return (
        <>
            <Header />
            <div className='container mx-auto py-8'>
                <Card>
                    <CardHeader>
                        <CardTitle>Nouvelle Commande</CardTitle>
                        <CardDescription>
                            Ajouter Informations Client et Produits.
                        </CardDescription>
                    </CardHeader>

                    {/* --- Step Indicators --- */}
                    <div className="flex justify-between px-4 py-2">
                        <div className={currentStep >= 1 ? "font-bold text-blue-600" : "text-gray-500"}>
                            <User className="inline-block h-4 w-4 mr-1" />
                            Client
                        </div>
                        <div className={currentStep >= 2 ? "font-bold text-green-600" : "text-gray-500"}>
                            <ShoppingBag className="inline-block h-4 w-4 mr-1" />
                            Produits
                        </div>
                      {/* Removed Payments Step */}
                    </div>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            <div className="relative pt-1">
                                <div className="flex mb-2 items-center justify-between">
                                    <div>
                                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                                            Step {currentStep} of {totalSteps}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-xs font-semibold inline-block text-blue-600">
                                            {Math.round((currentStep / totalSteps) * 100)}%
                                        </span>
                                    </div>
                                </div>
                                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                                    <div
                                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"
                                    >
                                    </div>
                                </div>
                            </div>


                            {/* --- Client Section (Step 1) --- */}
                            {currentStep === 1 && (
                                <Card className="p-4 border rounded-lg">
                                    <CardHeader>
                                        <CardTitle><User className="mr-2 h-5 w-5 text-blue-500" /> Client Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="mb-4">
                                            <Input
                                                type="text"
                                                placeholder="Search clients..."
                                                value={clientSearchTerm}
                                                onChange={(e) => setClientSearchTerm(e.target.value)}
                                                className="w-full"
                                            />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <Label htmlFor="client">Client:</Label>
                                                <Select onValueChange={handleClientChange} value={order.client?._id}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a client" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {filteredClients.map((client) => (
                                                            <SelectItem key={client._id} value={client._id}>
                                                                {client.nom}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="adresse">Address:</Label>
                                                <Input
                                                    id="adresse"
                                                    value={order.client?.adresse || ''}
                                                    onChange={handleInputChange}
                                                    disabled
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="telephone">Phone:</Label>
                                                <Input
                                                    id="telephone"
                                                    value={order.client?.telephone || ''}
                                                    onChange={handleInputChange}
                                                    disabled
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* --- Products Section (Step 2) --- */}
                            {currentStep === 2 && (
                                <Card className="p-4 border rounded-lg">
                                    <CardHeader>
                                        <CardTitle><ShoppingBag className="mr-2 h-5 w-5 text-green-500" /> Products</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Table for Existing Products */}
                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Existing Products</h3>
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Product</TableHead>
                                                            <TableHead className="text-right">Price</TableHead>
                                                            <TableHead className="text-right">Quantity</TableHead>
                                                            <TableHead className="text-right">Discount (%)</TableHead>
                                                            <TableHead className="text-right">Actions</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {order.produits?.map((item) => (
                                                            <TableRow key={item.produit._id}>
                                                                <TableCell>{item.produit.nom}</TableCell>
                                                                <TableCell className="text-right">
                                                                    {formatCurrency(item.produit.prix)}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.quantite}
                                                                        onChange={(e) => handleInputChange(e, item._id, "quantite")}
                                                                        className="w-24 text-right"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.remise}
                                                                        onChange={(e) => handleInputChange(e, item._id, "remise")}
                                                                        className="w-24 text-right"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        onClick={() => handleDeleteProduct(item._id)}
                                                                    >
                                                                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700 transition" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </div>

                                            <div>
                                                <h3 className="text-lg font-semibold mb-3">Add New Product</h3>
                                                <div className="mb-4">
                                                    <Input
                                                        type="text"
                                                        placeholder="Search products..."
                                                        value={productSearchTerm}
                                                        onChange={(e) => setProductSearchTerm(e.target.value)}
                                                        className="w-full"
                                                    />
                                                </div>
                                                <div className="grid grid-cols-4 gap-4">
                                                    <div>
                                                        <Label htmlFor="new-product">Product:</Label>
                                                        <Select
                                                            onValueChange={(value) => handleNewProductChange('productId', value)}
                                                            value={newProduct.productId}
                                                        >
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Select a product" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {filteredProducts.map(product => (
                                                                    <SelectItem key={product._id} value={product._id}>
                                                                        {product.nom}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div>
                                                        <Label htmlFor='new-price'> Price:</Label>
                                                        <Input id='new-price' value={products.find((p) => p._id === newProduct.productId)?.prix || ''} disabled className="w-full text-right" />

                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-quantity">Quantity:</Label>
                                                        <Input
                                                            id="new-quantity"
                                                            type="number"
                                                            value={newProduct.quantity}
                                                            onChange={(e) => handleNewProductChange('quantity', e.target.value)}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label htmlFor="new-discount">Discount (%):</Label>
                                                        <Input
                                                            id="new-discount"
                                                            type="number"
                                                            value={newProduct.discount}
                                                            onChange={(e) => handleNewProductChange('discount', e.target.value)}
                                                            className="w-full"
                                                        />
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleAddProduct}
                                                    className="mt-4 w-full"
                                                >
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                                                </Button>
                                            </div>
                                              {/* Global Discount */}
                                            <div className='mt-4'>
                                            <Label htmlFor="remiseGlobale">Global Discount (%):</Label>
                                            <Input
                                                type="number"
                                                id="remiseGlobale"
                                                name="remiseGlobale"
                                                value={order?.remiseGlobale || ''}
                                                onChange={handleInputChange}
                                                className="w-full"
                                                placeholder="Enter global discount"
                                            />
                                            </div>
                                        </div>

                                    </CardContent>
                                </Card>
                            )}
                            {/* Total Due */}
                            <div className="mt-6 p-4 border rounded-md bg-gray-50">
                                <h2 className="text-lg font-semibold">Total Due:</h2>
                                <p className="text-xl font-bold text-blue-600">
                                     {formatCurrency(calculateTotalDue(order.produits, order?.remiseGlobale))} {/*Removed Payments*/}
                                </p>
                            </div>

                        </CardContent>
                        {/* --- Navigation Buttons --- */}
                        <CardFooter className="flex justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={goToPreviousStep}
                                disabled={currentStep === 1}
                            >
                                <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                            </Button>
                            <div className='space-x-3'>
                                {currentStep < totalSteps && (
                                    <Button type="button" variant="outline" onClick={goToNextStep}>
                                        Next <ChevronRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                                <Button type="submit" >
                                        Valider Commande
                                </Button>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
};

export default NewOrderPage;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button, Input, Label } from '@/components/ui/index';
import { useToast } from "@/components/ui/use-toast"
import { Trash2, PlusCircle, MinusCircle, User, ShoppingBag, CreditCard, ChevronRight, ChevronLeft } from 'lucide-react';

import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription
} from "@/components/ui/card"
import Header from '@/components/layout/Header';
import axiosInstance from '@/utils/axiosInstance';
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


// --- Interfaces ---
interface Order {
    _id: string;
    client: {
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
            stock: number; // Add the stock property here
        };
        quantite: string;
        remise: string;
    }[];
    payments?: {
        id: string;
        typePaiement: string;
        montant: string;  // Keep as string!
    }[];
    remiseGlobale?: string;
    createdAt: string;
    updatedAt: string;
    status?: string;
}

interface Client {
    _id: string;
    nom: string;
    adresse: string;
        telephone: string;
}

interface Product {
    _id: string;
    nom: string;
    prix: number | string;
    stock: number;
}

// --- Helper Functions ---
// Keep the number | string and validation here
const formatCurrency = (value: string | number) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(numValue)) {
    return "Invalid Input";
  }
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numValue);
};

const calculateOrderSubtotal = (orderItems: Order['produits']) => {
  if (!orderItems) return 0;
  return orderItems.reduce((total, item) => {
    const price = parseFloat(item.produit.prix.toString());
    const quantity = parseInt(item.quantite);
    const discount = parseFloat(item.remise) || 0;
    return total + (price * quantity * (1 - discount / 100));
  }, 0);
};

//Accept and returns string.
const calculateTotalPayments = (payments: Order['payments'][] | undefined): string => {
  if (!payments) return '0';
  let total = 0;
  for (const payment of payments) {
      const amount = parseFloat(payment.montant);
        if (!isNaN(amount)) {
            total += amount;
        }
  }
  return total.toFixed(2);
};
// NEW: Calculate total due considering global discount
const calculateTotalDue = (orderItems: Order['produits'], payments: Order['payments'], globalDiscount: string = '0') => {
  const subtotal = calculateOrderSubtotal(orderItems);
  const totalPayments = parseFloat(calculateTotalPayments(payments));
  const discount = parseFloat(globalDiscount) || 0; // Default to 0
  const discountedSubtotal = subtotal * (1 - discount / 100);
  return discountedSubtotal - totalPayments;
};

// --- Component ---
const OrderEditPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);  //This Product interface include stock
  const { toast } = useToast();
  const [newProduct, setNewProduct] = useState<{
    productId: string;
    quantity: string;
    discount: string;
  }>({
    productId: '',
    quantity: '',
    discount: '',
  });

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [clientSearchTerm, setClientSearchTerm] = useState('');

  // --- State for New Payment ---
    const [newPayment, setNewPayment] = useState<{ typePaiement: string; montant: string }>({
        typePaiement: '', // Now correctly initialized
        montant: '',
    });

// NEW: State for current step
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3; // Client, Products, Payments


  // --- Fetch Order, Clients, and Products ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const orderResponse = await axiosInstance.get<Order>(`api/commandes/${orderId}`);
        setOrder(orderResponse.data);

        const clientsResponse = await axiosInstance.get<Client[]>(`api/clients`);
        setClients(clientsResponse.data);

        // Fetch products with stock information
        const productsResponse = await axiosInstance.get<Product[]>(`api/produits`);
        setProducts(productsResponse.data);


      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch order, client, or product data.",
          variant: "destructive"
        });
        navigate('/orders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId, navigate, toast]);

    // --- Input Change Handlers ---
    const handleInputChange = (
        event: React.ChangeEvent<HTMLInputElement>,
        productId?: string,
        field?: string
    ) => {
        const { name, value } = event.target;
        const numValue = parseInt(value, 10); // Parse to integer for validation


        if (productId && field) {
            setOrder((prevOrder) => {
                if (!prevOrder?.produits) return prevOrder;

                const productIndex = prevOrder.produits.findIndex(p => p._id === productId);
                if (productIndex === -1) return prevOrder; // Product not found

                const updatedProduits = [...prevOrder.produits]; // Create a copy

                if (field === 'quantite') {
                    // Find the product in your 'products' state
                    const selectedProduct = products.find(p => p._id === updatedProduits[productIndex].produit._id);

                    // Stock Validation:
                    if (selectedProduct && !isNaN(numValue) && numValue > selectedProduct.stock) {
                        toast({
                            variant: 'destructive',
                            title: 'Error',
                            description: `Quantity cannot exceed available stock (${selectedProduct.stock}).`,
                        });
                        return prevOrder;  // Important: Don't update the state
                    }
                     // If valid, update the quantity.  Keep as string
                      updatedProduits[productIndex] = { ...updatedProduits[productIndex], quantite: value };
                }
                 else if (field === 'remise') {
                   // No stock check for discount, just update
                    updatedProduits[productIndex] = { ...updatedProduits[productIndex], [field]: value };
                 }

                return { ...prevOrder, produits: updatedProduits };
            });

        } else { // Its not a change on existing product
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
    const handleClientChange = (id) => {
        const selectedClient = clients.find((c) => c._id === id);

        setOrder((prevOrder) => ({
        ...prevOrder,
        client: selectedClient
            ? {
                _id: selectedClient._id,
                nom: selectedClient.nom,
                adresse: selectedClient.adresse || '',
                telephone: selectedClient.telephone || '',
            }
            : prevOrder?.client,
        }));
        alert(order.client.nom)
    };

  // Handle product deletion
 const handleDeleteProduct = async(productId: string) => {
    setOrder((prevOrder) => {
      if (!prevOrder?.produits) return prevOrder;
     
      const updatedProduits = prevOrder.produits.filter((p) => p._id !== productId);
      return { ...prevOrder, produits: updatedProduits };
    });
    const products=order.produits.find(p=>p._id==productId)
    try {
        await axiosInstance.put(`api/produits/${productId}/retirer`,{quantite:products.quantite})
    } catch (error) {
        
    }
  };


  // Handle changes to the new product's details
  const handleNewProductChange = (field: 'productId' | 'quantity' | 'discount', value: string) => {
    // If the field is 'quantity', check against the selected product's stock
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
        return; // Prevent updating the state
      }
    }

    setNewProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
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

 // Add the new product to the order
  const handleAddProduct = () => {
    if (!newProduct.productId || !newProduct.quantity) {
      toast({
          title: "Error",
          description: "Failed to add product. You must fill productId and quantity.",
          variant: "destructive"
        });
      return;
    }

     const selectedProduct = products.find((p) => p._id === newProduct.productId);

    if (!selectedProduct) {
       toast({
          title: "Error",
          description: "Failed to add product. Product not found.",
          variant: "destructive"
        });
      return;
    }
      // Stock Validation
    const quantity = parseInt(newProduct.quantity, 10);
    if (isNaN(quantity) || quantity > selectedProduct.stock) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: `Quantity cannot exceed available stock (${selectedProduct.stock}).`,
        });
        return; // Don't add the product
    }

    if (order?.produits?.some((item) => item.produit._id === newProduct.productId)) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'This product is already in the order.',
      });
      return;
    }

    const productToAdd = {
      _id: selectedProduct._id,
      produit: {
        _id: selectedProduct._id,
        nom: selectedProduct.nom,
        prix: selectedProduct.prix,
        stock: selectedProduct.stock, // Include stock
      },
      quantite: newProduct.quantity,  // Keep as string for consistency
      remise: newProduct.discount || '0',
    };

    setOrder((prevOrder) => ({
      ...prevOrder,
      produits: [...(prevOrder?.produits || []), productToAdd],
    }));

    setNewProduct({  //Reset
      productId: '',
      quantity: '',
      discount: '',
    });
  };

   // NEW: Separate handlers for payment type and amount
    const handleNewPaymentTypeChange = (value: string) => {
        setNewPayment(prev => ({ ...prev, typePaiement: value }));
    };
     const handleNewPaymentAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNewPayment(prev => ({ ...prev, montant: event.target.value }));
    };

    const handleAddPayment = () => {

        // Validation is now done *before* creating the payment object
        if (!newPayment.typePaiement || !newPayment.montant) {
            toast({
                title: "Error",
                description: "Please fill in both payment type and amount.",
                variant: "destructive",
            });
            return;
        }

        if (isNaN(parseFloat(newPayment.montant))) {
             toast({
                title: "Error",
                description: "Invalid amount format.",
                variant: "destructive"
            });
            return;
        }

        const paymentToAdd = {
            id: uuidv4(),
            typePaiement: newPayment.typePaiement,
            montant: newPayment.montant, // Still a string
        };

        setOrder((prevOrder) => ({
            ...prevOrder,
            payments: [...(prevOrder?.payments || []), paymentToAdd],
        }));

        setNewPayment({  // Reset the form
            typePaiement: '',
            montant: '',
        });
    };
    const handleDeletePayment = useCallback((paymentId: string) => {
    setOrder((prevOrder) => {
        if (!prevOrder?.payments) return prevOrder;

        const updatedPayments = prevOrder.payments.filter(
        (p) => p.id !== paymentId
        );
        return { ...prevOrder, payments: updatedPayments };
    });
    }, []);

// NEW: Navigation functions
  const goToNextStep = () => {
    setCurrentStep((prevStep) => Math.min(prevStep + 1, totalSteps));
  };

  const goToPreviousStep = () => {
    setCurrentStep((prevStep) => Math.max(prevStep - 1, 1));
  };
  // --- Form Submission ---
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!order) return;
        // Simple validation: Check if required fields are filled
    if (currentStep === 1 && (!order.client?._id )) {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please select a client.',
        });
        return;
    }

    if (currentStep === 2 && (!order.produits || order.produits.length === 0)) {
         toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Please add at least one product.',
        });
        return;
    }
    const produits=order.produits.map(e=>({produit:e.produit._id,prix:e.produit.prix,quantite:e.quantite,remise:e.remise}))

    try {
      await axiosInstance.put(`api/commandes/${orderId}`,
        {clientId:order.client._id,produits:produits,payments:order.payments,remiseGlobale:order.remiseGlobale}
      );
      toast({
        title: "Success",
        description: "Order updated successfully.",
      });
      navigate('/Commande');
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!order) {
    return <div>Order not found.</div>;
  }

  return (
    <>
      <Header />
      <div className='container mx-auto py-8'>
        <Card>
          <CardHeader>
            <CardTitle>Edit Order: {orderId}</CardTitle>
            <CardDescription>
              Modify client information, products, and payments.
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
                  Products
                </div>
                <div className={currentStep >= 3 ? "font-bold text-yellow-600" : "text-gray-500"}>
                <CreditCard className="inline-block h-4 w-4 mr-1" />
                  Payments
                </div>
            </div>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">

             {/* --- Progress Bar --- */}
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
                        <Select onValueChange={handleClientChange} value={order.client._id}>
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
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                            <Label htmlFor="new-product">Product:</Label>
                            <Select onValueChange={(value) => handleNewProductChange('productId', value)} value={newProduct.productId}>
                                <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                     {filteredProducts.map((product) => (  // Corrected: Use filteredProducts
                                        <SelectItem key={product._id} value={product._id}>
                                             {product.nom}
                                        </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
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
                    </div>
                    </CardContent>
                </Card>
                )}

                {/* --- Payments Section (Step 3) --- */}
                {currentStep === 3 && (
                <Card className="p-4 border rounded-lg">
                    <CardHeader>
                    <CardTitle><CreditCard className="mr-2 h-5 w-5 text-yellow-500" /> Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                            <h3 className="text-lg font-semibold mb-2">Existing Payments</h3>
                            {/* Existing payments with Select for type */}
                            {order.payments && order.payments.length > 0 ? (
                                <Table>
                                <TableHeader>
                                    <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {order.payments.map((payment) => (
                                    <TableRow key={payment.id}>
                                       <TableCell>
                                          {/* Display Type Paiement */}
                                            {payment.typePaiement}
                                        </TableCell>
                                        <TableCell className="text-right">
                                        {formatCurrency(payment.montant)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDeletePayment(payment.id)}
                                        >
                                            <MinusCircle className="h-4 w-4 text-red-500 hover:text-red-700 transition" />
                                        </Button>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                                </Table>
                            ) : (
                                <p>No payments yet.</p>
                            )}
                            </div>

                            {/* Add New Payment and Global Discount */}
                            <div>
                                <h3 className="text-lg font-semibold mb-3">Add New Payment</h3>
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                    <Label htmlFor="new-payment-type">Payment Type:</Label>
                                     <Select onValueChange={handleNewPaymentTypeChange}  value={newPayment.typePaiement}>
                                        <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a payment type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                         <SelectItem value="Carte bancaire">Carte bancaire</SelectItem>
                                        <SelectItem value="Espèces">Espèces</SelectItem>
                                        <SelectItem value="Chèque">Chèque</SelectItem>
                                        <SelectItem value="Virement">Virement</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    </div>
                                    <div>
                                    <Label htmlFor="new-payment-amount">Amount:</Label>
                                    <Input
                                        id="new-payment-amount"
                                        value={newPayment.montant}
                                        onChange={handleNewPaymentAmountChange}
                                        className="w-full"
                                    />
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleAddPayment}
                                    className="mb-4 w-full"
                                >
                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Payment
                                </Button>

                                {/* Global Discount */}
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
                  {formatCurrency(calculateTotalDue(order.produits, order.payments, order?.remiseGlobale))}
                </p>
              </div>

            </CardContent>
              {/* --- Navigation Buttons --- */}
            <CardFooter className="flex justify-between">
                <Button type="button" variant="outline" onClick={goToPreviousStep} disabled={currentStep === 1}>
                    <ChevronLeft className="mr-2 h-4 w-4" /> Previous
                </Button>
                {currentStep < totalSteps && (
                    <Button type="button" variant="outline" onClick={goToNextStep}>
                    Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                )}
                 {currentStep === totalSteps && (
                    <Button type="submit">Save Changes</Button>
                )}

            </CardFooter>
          </form>
        </Card>
      </div>
    </>
  );
};

export default OrderEditPage;
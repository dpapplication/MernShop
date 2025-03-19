import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Input, Label } from '@/components/ui/index';
import { useToast } from "@/components/ui/use-toast"
import axiosInstance from '@/utils/axiosInstance';
import { PlusCircle, User, ShoppingBag,Box, Trash2 } from 'lucide-react'; // Added Box icon for services

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

// --- Interfaces ---
interface Order {
    _id: string;
    client: {
        _id: string;
        nom: string;
        adresse: string;
        telephone: string;
    };
    produits: {
        _id: string;
        produit: {
            _id: string;
            nom: string;
            prix: number;
            stock: number;
        };
        quantite: number;
        remise: number;
    }[];
    services: {  // Added services
      _id: string;
      service: {
        _id: string;
        nom: string;
        prix: number;
      };
      remise: number;
    }[];
    remiseGlobale?: number;
    createdAt: string;
    status: boolean;
    date: string;
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
    prix: number;
    stock: number;
}
interface Service { // Add Service interface
    _id: string;
    nom: string;
    prix: number;
}

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};
//Calculate subtotal for products.
const calculateProductsSubtotal = (orderItems?: Order['produits']) => {
    if (!orderItems) return 0;

    return orderItems.reduce((total, item) => {
        const price = item.produit.prix;
        const quantity = item.quantite;
        const discount = item.remise || 0;
        return total + (price * quantity - discount);
    }, 0);
};

//Calculate subtotal for service
const calculateServicesSubtotal = (orderServices?: Order['services']) => {
    if (!orderServices) return 0;

    return orderServices.reduce((total, item) => {
        const price = item.service.prix;
        const discount = item.remise || 0;
        return total + (price - discount);
    }, 0);
};
//Calculate Total
const calculateOrderTotal = (productsSubtotal: number, servicesSubtotal: number, globalDiscount: number = 0): string => {
    const total = productsSubtotal + servicesSubtotal - globalDiscount;
    return total.toFixed(2);
};


// --- Component ---
const EditOrderPage: React.FC = () => {
    const navigate = useNavigate();
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [services, setServices] = useState<Service[]>([]); // Add services state

    const { toast } = useToast();

    const [productSearchTerm, setProductSearchTerm] = useState('');
    const [serviceSearchTerm, setServiceSearchTerm] = useState(''); // Add service search term


    const [newProduct, setNewProduct] = useState<{ productId: string; quantity: string; discount: string; prix: string }>({
        productId: '',
        quantity: '',
        discount: '',
        prix: ''
    });

      // --- State for New Service ---
    const [newService, setNewService] = useState<{ serviceId: string; discount: string; prix: string }>({
        serviceId: '',
        discount: '',
        prix: ''
    });


    // --- Fetch Order, Clients, Products, and Services ---
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [orderResponse, clientsResponse, productsResponse, servicesResponse] = await Promise.all([
                    axiosInstance.get<Order>(`/api/commandes/${orderId}`),
                    axiosInstance.get<Client[]>(`api/clients`),
                    axiosInstance.get<Product[]>(`api/produits`),
                    axiosInstance.get<Service[]>(`api/services`), // Fetch services
                ]);
                setOrder(orderResponse.data);
                setClients(clientsResponse.data);
                setProducts(productsResponse.data);
                setServices(servicesResponse.data); // Set services
            } catch (error) {
                console.error("Error fetching data:", error);
                toast({ title: "Error", description: "Failed to fetch data.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };

        if (orderId) {
            fetchData();
        }
    }, [orderId, toast]);

    // --- Input Change Handlers ---
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    itemId?: string,
    field?: string,
    itemType?: 'produit' | 'service'
  ) => {
    const { name, value } = event.target;

    if (itemId && field && itemType) {
      setOrder((prevOrder) => {
        if (!prevOrder) return prevOrder;

        const items = itemType === 'produit' ? prevOrder.produits : prevOrder.services;
        const itemIndex = items.findIndex(p => p._id === itemId);
        if (itemIndex === -1) return prevOrder;

        const updatedItems = [...items];

        if (field === 'quantite') {
            const numValue = parseInt(value, 10);
            const selectedProduct = products.find(p => p._id === (items[itemIndex] as any).produit._id); //Needs check because service haven't quantity

              if (selectedProduct && !isNaN(numValue) && numValue > selectedProduct.stock) {
                toast({ variant: 'destructive', title: 'Error', description: `Quantity cannot exceed available stock (${selectedProduct.stock}).`});
                return prevOrder;
            }
            (updatedItems[itemIndex] as any).quantite = parseInt(value, 10); // Update quantity
        } else if (field === 'remise') {
            if (itemType === 'produit') {
                (updatedItems[itemIndex] as any).remise = parseFloat(value) || 0;
            } else {
                (updatedItems[itemIndex] as any).remise = parseFloat(value) || 0;
            }
        }

        return {
          ...prevOrder,
          [itemType === 'produit' ? 'produits' : 'services']: updatedItems,
        };
      });
    } else {
      setOrder((prevOrder) => {
        if (!prevOrder) return prevOrder;
        if (name === 'remiseGlobale') {
          return { ...prevOrder, [name]: parseFloat(value) || 0 };
        } else {
          return {
            ...prevOrder,
            client: {
              ...prevOrder.client,
              [name]: value,
            },
          };
        }
      });
    }
  };

    const handleClientChange = (value: string) => {
        const selectedClient = clients.find((c) => c._id === value);
        setOrder((prevOrder) => ({
            ...prevOrder,
            client: selectedClient
                ? {
                    _id: selectedClient._id,
                    nom: selectedClient.nom,
                    adresse: selectedClient.adresse || '',
                    telephone: selectedClient.telephone || ''
                }
                : undefined,
        }));
    };

   const handleNewProductChange = (field: 'productId' | 'quantity' | 'discount' | 'prix', value: string) => {
    if (field === 'quantity' && newProduct.productId) {
        const selectedProduct = products.find((p) => p._id === newProduct.productId);
        const numValue = parseInt(value, 10);
        if (selectedProduct && !isNaN(numValue) && numValue > selectedProduct.stock) {
            toast({ variant: "destructive",  title: "Error", description: `Quantity cannot exceed available stock (${selectedProduct.stock}).`, });
            return;
        }
    }

    if (field === 'productId') {
        const selectedProduct = products.find((product) => product._id === value);
        if (selectedProduct) {
            setNewProduct((prev) => ({
                ...prev,
                productId: value,
                prix: selectedProduct.prix.toString(),
            }));
        }
        return;
    }

    setNewProduct((prev) => ({
        ...prev,
        [field]: value,
    }));
    };

    const handleNewServiceChange = (field: 'serviceId' | 'discount' | 'prix', value: string) => {
        if (field === 'serviceId') {
            const selectedService = services.find((service) => service._id === value);
            if (selectedService) {
                setNewService((prev) => ({
                    ...prev,
                    serviceId: value,
                    prix: selectedService.prix.toString(), // Keep price as string for input
                }));
            }
            return;
        }

        setNewService((prev) => ({
            ...prev,
            [field]: value,
        }));
    };


    const handleDeleteProduct = (productId: string) => {
        setOrder((prevOrder) => {
            if (!prevOrder) return prevOrder;
            const updatedProduits = prevOrder.produits.filter((p) => p._id !== productId);
            return { ...prevOrder, produits: updatedProduits };
        });
    };

     // Handle service deletion
    const handleDeleteService = (serviceId: string) => {
        setOrder((prevOrder) => {
            if (!prevOrder?.services) return prevOrder;
            const updatedServices = prevOrder.services.filter((s) => s._id !== serviceId);
            return { ...prevOrder, services: updatedServices };
        });
    };

    const filteredProducts = useMemo(() => {
        return products.filter((product) =>
            product.nom.toLowerCase().includes(productSearchTerm.toLowerCase())
        );
    }, [products, productSearchTerm]);

     const filteredServices = useMemo(() => { // Filter services
        return services.filter((service) =>
            service.nom.toLowerCase().includes(serviceSearchTerm.toLowerCase())
        );
    }, [services, serviceSearchTerm]);


   const handleAddProduct = () => {
        if (!newProduct.productId || !newProduct.quantity) {
            toast({ variant: 'destructive', title: 'Error', description: 'Product and quantity are required.' });
            return;
        }

        const selectedProduct = products.find((p) => p._id === newProduct.productId);
        if (!selectedProduct) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected product not found.' });
            return;
        }
         const quantity = parseInt(newProduct.quantity, 10);
        if (isNaN(quantity) || quantity > selectedProduct.stock) {
          toast({ variant: "destructive", title: "Error",  description: `Quantity cannot exceed available stock (${selectedProduct.stock}).` });
          return;
        }


        if (order?.produits.some((item) => item.produit._id === newProduct.productId)) {
            toast({ variant: 'destructive', title: 'Error', description: 'Product already in order.' });
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
            quantite: parseInt(newProduct.quantity, 10),
            remise: parseFloat(newProduct.discount) || 0,
        };

        setOrder((prevOrder) => ({
            ...prevOrder,
            produits: [...(prevOrder?.produits || []), productToAdd],
        }));

        setNewProduct({ productId: '', quantity: '', discount: '', prix: '' });
        setProductSearchTerm("");
    };
    const handleAddService = () => {
        if (!newService.serviceId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Service is required.' });
            return;
        }

        const selectedService = services.find((s) => s._id === newService.serviceId);
        if (!selectedService) {
            toast({ variant: 'destructive', title: 'Error', description: 'Selected service not found.' });
            return;
        }

        if (order?.services?.some((item) => item.service._id === newService.serviceId)) {
            toast({ variant: 'destructive', title: 'Error', description: 'Service already in order.' });
            return;
        }

        const serviceToAdd = {
            _id: uuidv4(),
            service: {
                _id: selectedService._id,
                nom: selectedService.nom,
                prix: selectedService.prix,
            },
            remise: parseFloat(newService.discount) || 0,
        };

        setOrder((prevOrder) => ({
            ...prevOrder,
            services: [...(prevOrder?.services || []), serviceToAdd],
        }));

        setNewService({ serviceId: '', discount: '', prix: '' });
        setServiceSearchTerm("");
    };



    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      if (!order) return;

      const produits = order.produits.map(p => ({
          produit: p.produit._id,
          quantite: p.quantite,
          remise: p.remise,
          prix: p.produit.prix
      }));

      const services = order.services.map(s => ({
          service: s.service._id,
          remise: s.remise,
          prix: s.service.prix
      }));

      try {
          const response = await axiosInstance.put(`/api/commandes/${orderId}`, {
              clientId: order.client._id,
              produits: produits,
              services: services, // Send services
              remiseGlobale: order.remiseGlobale,
          });

          toast({ title: 'Success', description: 'Order updated successfully.' });
          navigate('/Commande');

      } catch (error) {
          console.error("Error updating order:", error);
          toast({ title: "Error", description: "Failed to update order.", variant: "destructive" });
      }
  };



    if (loading) {
        return <p>Loading...</p>;
    }

    if (!order) {
        return <p>Order not found.</p>;
    }

    return (
        <>
            <Header />
           <div className='container mx-auto py-8'>
                <Card>
                   <CardHeader>
                        <CardTitle>Edit Order</CardTitle>
                        <CardDescription>
                          Edit Client, Products, and Services.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6">
                            {/* --- Client and Products Sections --- */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                             {/* --- Client Section --- */}
                                <Card className="p-4 border rounded-lg">
                                    <CardHeader>
                                        <CardTitle><User className="mr-2 h-5 w-5 text-blue-500" /> Client Information</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid grid-cols-1  gap-4">
                                            <div>
                                                <Label htmlFor="client">Client:</Label>
                                                <Select onValueChange={handleClientChange} value={order.client._id}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Select a client" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {clients.map((client) => (
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
                                                    name="adresse"
                                                    value={order.client.adresse}
                                                    onChange={handleInputChange}
                                                    className="w-full"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="telephone">Phone:</Label>
                                                <Input
                                                    id="telephone"
                                                    name="telephone"
                                                    value={order.client.telephone}
                                                    onChange={handleInputChange}
                                                    className="w-full"
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* --- Products Section --- */}
                                 <Card className="p-4 border rounded-lg">
                                    <CardHeader>
                                        <CardTitle><ShoppingBag className="mr-2 h-5 w-5 text-green-500" /> Products</CardTitle>
                                    </CardHeader>
                                  <CardContent>
                                        <div className="grid grid-cols-1  gap-6">
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
                                                         {order.produits.map((item) => (
                                                            <TableRow key={item._id}>
                                                                <TableCell>{item.produit.nom}</TableCell>
                                                                <TableCell className="text-right">{formatCurrency(item.produit.prix)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.quantite}
                                                                        onChange={(e) => handleInputChange(e, item._id, "quantite", 'produit')}
                                                                        className="w-24 text-right"
                                                                    />
                                                                </TableCell>
                                                                 <TableCell className="text-right">
                                                                    <Input
                                                                        type="number"
                                                                        value={item.remise}
                                                                       onChange={(e) => handleInputChange(e, item._id, "remise", 'produit')}
                                                                        className="w-24 text-right"
                                                                    />
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                      <Button variant="ghost" size="icon"  onClick={() => handleDeleteProduct(item._id)}>
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
                                                            value={newProduct.productId}>
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
                                                        <Input id='new-price'  value={products.find((p) => p._id === newProduct.productId)?.prix || ''}  disabled  className="w-full text-right" />
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
                                                 <Button type="button"  variant="outline"  onClick={handleAddProduct}  className="mt-4 w-full" >
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                                                </Button>
                                            </div>
                                        </div>
                                     {/* Global Discount inside product card */}
                                        <div className="mt-6">
                                            <Label htmlFor="remiseGlobale">Global Discount (%):</Label>
                                            <Input
                                                type="number"
                                                id="remiseGlobale"
                                                name="remiseGlobale"
                                                value={order.remiseGlobale || 0}
                                                onChange={handleInputChange}
                                                className="w-full"
                                            />
                                        </div>

                                </CardContent>
                            </Card>
                          </div>

                        {/* Services Card */}
                        <Card className="p-4 border rounded-lg mt-6"> {/* Add mt-6 for spacing */}
                            <CardHeader>
                                <CardTitle><Box className="mr-2 h-5 w-5 text-green-500" /> Services</CardTitle> {/* Use Box icon */}
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">  {/* Use grid layout */}
                                    <div>
                                        <h3 className="text-lg font-semibold mb-3">Existing Services</h3>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Service</TableHead>
                                                    <TableHead className="text-right">Price</TableHead>
                                                    <TableHead className="text-right">Discount (%)</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {order.services?.map((item) => (
                                                <TableRow key={item._id}>
                                                    <TableCell>{item.service.nom}</TableCell>
                                                    <TableCell className="text-right">{formatCurrency(item.service.prix)}</TableCell>
                                                     <TableCell className="text-right">
                                                        <Input
                                                            type="number"
                                                            value={item.remise}
                                                            onChange={(e) => handleInputChange(e, item._id, "remise", 'service')}
                                                            className="w-24 text-right"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button  variant="ghost" size="icon"  onClick={() => handleDeleteService(item._id)}  >
                                                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700 transition" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            </TableBody>
                                        </Table>
                                      </div>

                                      <div>
                                         <h3 className="text-lg font-semibold mb-3">Add New Service</h3>
                                           <div className="mb-4">
                                              <Input
                                                type="text"
                                                placeholder="Search services..."
                                                value={serviceSearchTerm}
                                                onChange={(e) => setServiceSearchTerm(e.target.value)}
                                                className="w-full"
                                                />
                                           </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <Label htmlFor="new-service">Service:</Label>
                                                        <Select onValueChange={(value) => handleNewServiceChange('serviceId', value)}  value={newService.serviceId}>
                                                        <SelectTrigger className="w-full">
                                                            <SelectValue placeholder="Select a service" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {filteredServices.map(service => (
                                                                <SelectItem key={service._id} value={service._id}>
                                                                    {service.nom}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <Label htmlFor='new-service-price'> Price:</Label>
                                                    <Input id='new-service-price'  value={services.find((s) => s._id === newService.serviceId)?.prix || ''}  disabled  className="w-full text-right" />
                                                  </div>
                                                <div>
                                                    <Label htmlFor="new-service-discount">Discount (%):</Label>
                                                    <Input
                                                        id="new-service-discount"
                                                        type="number"
                                                        value={newService.discount}
                                                        onChange={(e) => handleNewServiceChange('discount', e.target.value)}
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>
                                           <Button  type="button" variant="outline" onClick={handleAddService}  className="mt-4 w-full"  >
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                                            </Button>
                                        </div>
                                    </div>
                            </CardContent>
                        </Card>
                           {/* Total Due */}
                            <div className="mt-6 p-4 border rounded-md bg-gray-50">
                                <h2 className="text-lg font-semibold">Total Due:</h2>
                                 <p className="text-xl font-bold text-blue-600">
                                  {formatCurrency(parseFloat(calculateOrderTotal(calculateProductsSubtotal(order.produits), calculateServicesSubtotal(order.services), order.remiseGlobale)))}
                                </p>
                            </div>
                        </CardContent>

                        <CardFooter className="justify-end">
                             <Button type="button" variant="outline" className="mr-2" onClick={() => navigate(-1)}>
                                Retour
                            </Button>
                            <Button type="submit">Update Order</Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </>
    );
};

export default EditOrderPage;
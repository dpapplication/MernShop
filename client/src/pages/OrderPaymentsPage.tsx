import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Input, Label } from '@/components/ui/index';
import { useToast } from "@/components/ui/use-toast";
import axiosInstance from '@/utils/axiosInstance';
import { PlusCircle, CreditCard, MinusCircle, CheckCircle, XCircle, Pencil } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Header from '@/components/layout/Header';

interface Payment {
    _id?: string;
    commande: string;
    montant: number;
    methode: string;
}

// Removed caisses
interface Produit {
    _id: string;
    nom: string;
    prix: number;
}
//add interface service
interface Service {
  _id: string;
  nom: string;
  prix: number;
}

interface Order {
   _id: string;
    client: {
        _id: string;
        nom: string;
        adresse: string;
        telephone: string;
    };
    produits: {
        produit: Produit;
        prix: number;
        quantite: number;
        remise: number;
    }[];
     services: {  // Added services
      service: Service;
      remise: number;
      prix:number
    }[];
    remiseGlobale?: number;
    status: boolean;
    date: string;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};
//Calculate subtotal for products.
const calculateProductsSubtotal = (orderItems?: Order['produits']) => {
    if (!orderItems) return 0;

    return orderItems.reduce((total, item) => {
        const price = item.prix;
        const quantity = item.quantite;
        const discount = item.remise || 0;
        return total + (price * quantity - discount);
    }, 0);
};

//Calculate subtotal for service
const calculateServicesSubtotal = (orderServices?: Order['services']) => {
    if (!orderServices) return 0;

    return orderServices.reduce((total, item) => {
        const price = item.prix;
        const discount = item.remise || 0;
        return total + (price - discount);
    }, 0);
};
const calculateTotalPayments = (payments: Payment[]): number => {
    if (!payments) return 0;
    let total = 0;
    for (const payment of payments) {
        total += payment.montant;
    }
    return total;
};

//Calculate rest to pay with services
const calculateRest = (productsSubtotal:number,servicesSubtotal:number, totalPayments: number, globalDiscount: number = 0): number => {
     const total = productsSubtotal + servicesSubtotal;
    const discountedSubtotal = total - globalDiscount;
    return discountedSubtotal - totalPayments;
};

const OrderPaymentsPage: React.FC = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    //Removed caisses
    const [newPayment, setNewPayment] = useState<Omit<Payment, '_id'>>({
        commande: orderId || '',
        montant: 0,
        methode: '',
    });

    const [isEditing, setIsEditing] = useState<string | null>(null);
    const [editedPayment, setEditedPayment] = useState<Payment>({
        commande: '',
        montant: 0,
        methode: ''
    });


    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [orderResponse, paymentsResponse] = await Promise.all([
                    axiosInstance.get<Order>(`/api/commandes/${orderId}`),
                    axiosInstance.get<Payment[]>(`/api/paiements/commande/${orderId}`),
                   //Removed caisses
                ]);
                setOrder(orderResponse.data);
                setPayments(paymentsResponse.data);
                //Removed set caisses
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

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;

        if (name === 'montant') {
            const numValue = parseFloat(value);
            if (isNaN(numValue)) {
                toast({ title: "Error", description: "Please enter a valid number for the amount.", variant: 'destructive' })
                return;
            }
            setNewPayment(prev => ({ ...prev, [name]: numValue }));
        } else {
            setNewPayment(prev => ({ ...prev, [name]: value }));
        }
    };
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
        const year = date.getFullYear();
        return `${day}-${month}-${year}`; // DD/MM/YYYY format
    };
      const handleEditInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = event.target;
        if(name === 'montant'){
          const numValue = parseFloat(value);
            if (isNaN(numValue)) {
            toast({ title: "Error", description: "Please enter a valid number for the amount.", variant: 'destructive' })
            return;
        }
         setEditedPayment(prev => ({ ...prev, [name]: numValue }));
        }else{
        setEditedPayment(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleEditClick = (payment: Payment) => {
        setIsEditing(payment._id!);
        setEditedPayment({ ...payment }); // Copy values to editedPayment
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setEditedPayment({ commande: '', montant: 0, methode: '' }); // Reset
    };

   const handleUpdatePayment = async () => {
     if ( !editedPayment.methode || isNaN(editedPayment.montant) || editedPayment.montant <= 0) {
            toast({ title: "Error", description: "Please fill all fields with valid values.", variant: "destructive" });
            return;
        }
    // Recalculate totals to check balance before updating
    const currentProductsSubtotal = order ? calculateProductsSubtotal(order.produits) : 0;
    const currentServicesSubtotal = order ? calculateServicesSubtotal(order.services) : 0; // Add services subtotal

    const otherPaymentsTotal = payments.filter(p => p._id !== isEditing).reduce((acc, p) => acc + p.montant, 0);
    const newTotalPayments = otherPaymentsTotal + editedPayment.montant;
    const currentGlobalDiscount = order?.remiseGlobale || 0;
    const remainingBalance = calculateRest(currentProductsSubtotal, currentServicesSubtotal, newTotalPayments, currentGlobalDiscount);


        if (editedPayment.montant > remainingBalance) {
            toast({ title: 'Error', description: 'Payment amount exceeds remaining balance.', variant: 'destructive' });
            return;
        }

        try {
            await axiosInstance.put(`/api/paiements/${isEditing}`, editedPayment);
            setPayments(prevPayments =>
                prevPayments.map(p => (p._id === isEditing ? { ...editedPayment, _id: p._id } : p))
            );

             // Recalculate totals after updating
            const updatedProductsSubtotal = order ? calculateProductsSubtotal(order.produits) : 0;
            const updatedServicesSubtotal = order ? calculateServicesSubtotal(order.services): 0; // services
            const updatedTotalPayments = calculateTotalPayments(payments);  // Recalculate with updated payments
            const updatedRemainingBalance = calculateRest(updatedProductsSubtotal, updatedServicesSubtotal, updatedTotalPayments, currentGlobalDiscount);


           if (updatedRemainingBalance <= 0.001) {
                await axiosInstance.put(`/api/commandes/active/${orderId}`);
                setOrder(prevOrder => ({...prevOrder, status: true}));
            } else {
                await axiosInstance.put(`/api/commandes/desactive/${orderId}`);
                 setOrder(prevOrder => ({...prevOrder, status: false}));
            }

            toast({ title: "Success", description: "Payment updated successfully." });
            setIsEditing(null);
            setEditedPayment({ commande: '', montant: 0, methode: '' });

        } catch (error) {
            console.error("Error updating payment:", error);
            toast({ title: "Error", description: "Failed to update payment.", variant: "destructive" });
        }
    };


   const handleAddPayment = async () => {
    if (!newPayment.methode || isNaN(newPayment.montant) || newPayment.montant <= 0) {
      toast({ title: "Error", description: "Please fill all fields with valid values.", variant: "destructive" });
      return;
    }

    // Calculate based on *current* state.
    const currentProductsSubtotal = order ? calculateProductsSubtotal(order.produits) : 0;
    const currentServicesSubtotal = order ? calculateServicesSubtotal(order.services) : 0;  // Add service subtotal
    const currentTotalPayments = calculateTotalPayments(payments);
    const currentGlobalDiscount = order?.remiseGlobale || 0;
    const remainingBalance = calculateRest(currentProductsSubtotal, currentServicesSubtotal, currentTotalPayments, currentGlobalDiscount);

    if (newPayment.montant > remainingBalance) {
      toast({ title: 'Error', description: 'Payment amount exceeds remaining balance.', variant: 'destructive' });
      return;
    }

    try {
      const response = await axiosInstance.post<Payment>(`/api/paiements`, newPayment);
      setPayments(prevPayments => [...prevPayments, response.data]);
      setNewPayment({ commande: orderId || '', montant: 0, methode: '' });

      const newTotalPayments = calculateTotalPayments([...payments, response.data]);
      const newRemainingBalance = calculateRest(currentProductsSubtotal, currentServicesSubtotal,  newTotalPayments, currentGlobalDiscount);

      if (newRemainingBalance <= 0.001) {
        await axiosInstance.put(`/api/commandes/active/${orderId}`);
        setOrder(prevOrder => ({ ...prevOrder, status: true }));
      }
      toast({ title: "Success", description: "Payment added successfully." });

    } catch (error) {
      console.error("Error adding payment:", error);
      toast({ title: "Error", description: "Failed to add payment.", variant: "destructive" });
    }
  };


    const handleDeletePayment = async (paymentId: string) => {
        try {
            await axiosInstance.delete(`/api/paiements/${paymentId}`);
            setPayments(prevPayments => prevPayments.filter(p => p._id !== paymentId));
            toast({ title: "Success", description: "Payment deleted successfully." });
              const currentProductsSubtotal = order ? calculateOrderSubtotal(order.produits) : 0;
              const currentServicesSubtotal = order ? calculateServicesSubtotal(order.services) : 0; // services
             const newTotalPayments = calculateTotalPayments(payments.filter(p => p._id !== paymentId));
             const currentGlobalDiscount = order?.remiseGlobale || 0;
             const newRemainingBalance = calculateRest(currentProductsSubtotal, currentServicesSubtotal, newTotalPayments, currentGlobalDiscount);

            if(order.status === true &&  newRemainingBalance > 0){
               try {
                    await axiosInstance.put(`/api/commandes/desactive/${orderId}`);
                    setOrder(prevOrder => ({ ...prevOrder, status: false }));

                } catch (updateError) {
                     console.error("Error updating order status:", updateError);
                }
             }

        } catch (error) {
            console.error("Error deleting payment:", error);
            toast({ title: "Error", description: "Failed to delete payment.", variant: "destructive" });
        }
    };


     const totalPaymentsAmount = useMemo(() => {
        return calculateTotalPayments(payments);
    }, [payments]);

    const productsSubtotal = useMemo(() => { // Use useMemo for subtotal
      return order ? calculateProductsSubtotal(order.produits) : 0;
    }, [order]);

    const servicesSubtotal = useMemo(() => { // Use useMemo for service subtotal
        return order ? calculateServicesSubtotal(order.services) : 0;
    }, [order]);

    const remainingBalance = useMemo(() => {
        if (!order) return 0;
        const globalDiscount = order.remiseGlobale || 0;
        return calculateRest(productsSubtotal, servicesSubtotal, totalPaymentsAmount, globalDiscount);
    }, [order, productsSubtotal, servicesSubtotal, totalPaymentsAmount]);


    if (loading) {
        return <p>Loading payments...</p>;
    }

    if (!order) {
        return <p>Order not found.</p>;
    }

    return (
        <div className="container mx-auto p-4">
            <Header />
            <h1 className="text-2xl font-bold mb-4">N° COmmande: {orderId}</h1>
            <Button variant="outline" className="mb-4" onClick={() => navigate(-1)}>
                Retour
            </Button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Type de paiement</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Méthode</TableHead>
                                        <TableHead className="text-right">Montant</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.length > 0 ? (
                                        payments.map((payment) => (
                                            <TableRow key={payment._id}>
                                                {isEditing === payment._id ? (
                                                    <>
                                                        {/* Editing Mode */}
                                                        <TableCell>
                                                            <Select onValueChange={(value) => handleEditInputChange({ target: { name: 'methode', value } } as any)} value={editedPayment.methode}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select method" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="Carte">Carte</SelectItem>
                                                                    <SelectItem value="Espèces">Espèces</SelectItem>
                                                                    <SelectItem value="Chèque">Chèque</SelectItem>
                                                                    <SelectItem value="Virement">Virement</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Input
                                                                type="number"
                                                                name="montant"
                                                                value={editedPayment.montant === 0 ? '' : editedPayment.montant}
                                                                onChange={handleEditInputChange}
                                                                className="w-full text-right"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center justify-end space-x-2">
                                                                <Button variant="outline" size="icon" onClick={handleUpdatePayment}>
                                                                    <CheckCircle className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={handleCancelEdit}>
                                                                    <XCircle className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        {/* Display Mode */}
                                                        <TableCell>{payment.methode}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(payment.montant)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex items-center justify-end space-x-2">
                                                                <Button variant="outline" size="icon" onClick={() => handleEditClick(payment)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" onClick={() => handleDeletePayment(payment._id!)}>
                                                                    <MinusCircle className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </>
                                                )}
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center">No payments found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle></CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="methode">Méthode:</Label>
                                <Select onValueChange={(value) => handleInputChange({ target: { name: 'methode', value } } as any)} value={newPayment.methode}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Carte">Carte</SelectItem>
                                        <SelectItem value="Espèces">Espèces</SelectItem>
                                        <SelectItem value="Chèque">Chèque</SelectItem>
                                        <SelectItem value="Virement">Virement</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="montant">Montant:</Label>
                                <Input
                                    type="number"
                                    id="montant"
                                    name="montant"
                                    value={newPayment.montant === 0 ? '' : newPayment.montant}
                                    onChange={handleInputChange}
                                    className="w-full"
                                    placeholder="Enter amount"
                                />
                            </div>
                        </div>
                        <Button type="button" variant="outline" onClick={handleAddPayment} className="mt-4">
                            <PlusCircle className="mr-2 h-4 w-4" /> Ajouter
                        </Button>

                         <div className="mt-6 p-4 border rounded-md bg-gray-50">
                            <h2 className="text-lg font-semibold mb-2">Vue globale</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p><span className="font-medium">Client:</span> {order.client.nom}</p>
                                    <p><span className="font-medium">Date:</span> {formatDate(order.date)}</p>
                                    <p><span className='font-medium'>Status:</span> {order.status ? <span className='text-green-500'>Payée</span> : <span className='text-yellow-500'>En attente</span>}</p>
                                </div>
                                 <div>
                                    <p><span className="font-medium">Total produits:</span> {formatCurrency(productsSubtotal)}</p>
                                     <p><span className="font-medium">Total service:</span> {formatCurrency(servicesSubtotal)}</p>
                                    <p><span className="font-medium">Total:</span> {formatCurrency(totalPaymentsAmount)}</p>
                                    <p><span className="font-medium">Remise globale:</span> {order.remiseGlobale || 0}%</p>
                                    <p className='font-bold'><span className="font-medium">Reste à payer:</span> {formatCurrency(remainingBalance)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OrderPaymentsPage;
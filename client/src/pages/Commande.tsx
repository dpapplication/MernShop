import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, Pencil, Trash2, CheckCircle, Eye, CreditCard } from 'lucide-react'; // Added CreditCard icon
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'
import axiosInstance from '@/utils/axiosInstance';
import { Link } from 'react-router-dom';

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
        produit: {
            _id: string;
            nom: string;
            prix: number;
            stock: number;
        };
        quantite: number;
        remise: number;
    }[];
    remiseGlobale?: number;
    date: string;
    status: boolean;
}

// Interface for Payment
interface Payment {
    _id: string;
    methode: string;
    montant: number;
    caisse: string; // Assuming caisse has a string ID
}

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const calculateOrderSubtotal = (orderItems: Order['produits']): number => {
    if (!orderItems) return 0;
    return orderItems.reduce((total, item) => {
        return total + (item.produit.prix * item.quantite - (item.remise || 0));
    }, 0);
};

// Keep calculateTotalPayments as async
const calculateTotalPayments = async (orderId: string): Promise<number> => {
  try {
    const response = await axiosInstance.get(`/api/paiements/commande/${orderId}`);
    const payments = response.data;

    if (!payments || payments.length === 0) {
      return 0;
    }

    return payments.reduce((total, payment) => total + payment.montant, 0);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return 0; // Return 0 on error
  }
};



const calculateTotalDue = (subtotal: number, totalPayments: number, globalDiscount: number = 0): string => {
    const discountedSubtotal = subtotal - globalDiscount;
    return (discountedSubtotal - totalPayments).toFixed(2);
};

// --- Component ---
const OrderListPage = () => {
    const { toast } = useToast();
    const [orders, setOrders] = useState<Order[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // State to hold payments for the selected order
    const [selectedOrderPayments, setSelectedOrderPayments] = useState<Payment[]>([]);


    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get<Order[]>(`api/commandes`);
            setOrders(response.data);
        } catch (error) {
            console.error("Error fetching orders:", error);
            toast({ title: "Erreur", description: "Impossible de charger les commandes.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);



    const handlePdf = (order: Order) => {
        if (!order) return;
        const doc = new jsPDF();

        // Company info (replace with your actual info)
        doc.setFontSize(20);
        doc.text("Le Mobile", 14, 20);
        doc.setFontSize(10);
        doc.text("57 Avenue Alphonse Denis", 14, 27);
        doc.text("83400 Hyères", 14, 34);
        doc.text("Tel:0980496621", 14, 41);
        // Assuming you have a company logo, add it like this:
        const logoImg = new Image()
        logoImg.src = './logo.jpeg' //  relative to the public directory
        doc.addImage(logoImg, 'JPEG', 150, 15, 45, 45) // x, y, width, height


        // Title
        doc.setFontSize(20);
        doc.text("Facture", 105, 60, { align: 'center' });

        // Order and client info
        doc.setFontSize(12);
        doc.text(`Order Number: ORD-${order._id.substring(order._id.length - 6)}`, 14, 75);
        doc.text(`Date: ${order.date}`, 14, 82);  // Format this!

        if (order.client) {
            doc.setFontSize(14);
            doc.text("Information du Client:", 14, 95);
            doc.setFontSize(11);
            doc.text(`Nom: ${order.client.nom}`, 14, 102);
            doc.text(`Addresse: ${order.client.adresse}`, 14, 109);
            doc.text(`Tel: ${order.client.telephone}`, 14, 116);
        }

        // --- Horizontal Line ---
        doc.setLineWidth(0.5);
        doc.line(14, 125, 196, 125);  // (x1, y1, x2, y2)


        const items = order.produits?.map((item, index) => [
            item.produit.nom,
            item.quantite,
            item.produit.prix,
            `${item.remise}`,
            (item.produit.prix * item.quantite - (item.remise || 0)).toFixed(2)
        ]);

        const columns = ["Produit", "Quantité", "Prix Unitaire", "Remise", "Total"];

        // Add the table with products to the PDF using jsPDF-AutoTable
        autoTable(doc, {
            head: [columns],
            body: items,
            startY: 130,
            headStyles: { fillColor: [41, 128, 185] },  //  header styling
            columnStyles: {  // Right-align numeric columns for readability.
                1: { halign: 'center' },  // Quantity
                2: { halign: 'center' },  // Unit Price
                3: { halign: 'center' }, //Remise
                4: { halign: 'center' }, // Total
            },
            margin: { top: 10, right: 14, bottom: 10, left: 14 },
            theme: 'striped', // Apply a theme for styling (optional)
        });

        // --- Get Payments ---
        // Fetch payments within handlePdf
        axiosInstance.get(`/api/paiements/commande/${order._id}`)
            .then(paymentsResponse => {
                const payments = paymentsResponse.data;

                // --- Payment details ---
                if (payments && payments.length > 0) {
                    let startY = (doc as any).lastAutoTable.finalY + 15; // Cast doc to any to access lastAutoTable
                    doc.setFontSize(14);
                    doc.text("Payments:", 14, startY);
                    startY += 7;
                    const paymentsData = payments.map((payment) => [
                        payment.methode,
                        formatCurrency(payment.montant), // format currency
                    ]);

                    autoTable(doc, {
                        head: [['Payment Type', 'Amount']], //
                        body: paymentsData, // Use data for display payments details
                        startY: startY,
                        headStyles: { fillColor: [41, 128, 185] },
                        columnStyles: { 1: { halign: 'right' } },
                        margin: { left: 14 },
                    });
                }
                const orderTotal = calculateOrderSubtotal(order.produits);
                const totalPayments = calculateTotalPayments(order._id);
                const remainingAmount = orderTotal - totalPayments;
                const remiseGlobale = order.remiseGlobale || 0;
                const discountedSubtotal = (orderTotal - remiseGlobale).toFixed(2)

                let startY = (doc as any).lastAutoTable.finalY + 15; // Cast doc to any to access lastAutoTable
                doc.setFontSize(10);
                doc.text(`Total : ${orderTotal.toFixed(2)}€`, 196, startY, { align: 'right' });
                startY += 7;

                // Global Discount
                if (order.remiseGlobale) {
                    doc.text(`Remise Total: ${order.remiseGlobale.toFixed(2)}€`, 196, startY, { align: 'right' });
                    startY += 7;
                }
                totalPayments.then(total => { // totalPayments is a Promise
                    doc.text(`Total Payer: ${total.toFixed(2)}`, 196, startY, { align: 'right' });
                    startY += 7;
                    // Add total in bold
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    calculateTotalDue(orderTotal, total, order.remiseGlobale)
                    doc.text(`Reste a payer: ${calculateTotalDue(orderTotal, total, order.remiseGlobale)}€`, 196, startY, { align: 'right' });
                    doc.setFont('helvetica', 'normal');// Reset to normal
                    // Footer
                    doc.setFontSize(10);
                    doc.text("Merci pour votre visite!", 105, 280, { align: 'center' });
                    doc.save(`invoice_${order._id}.pdf`);

                });


            })
            .catch(error => {
                console.error("Error fetching payments for PDF:", error);
                doc.setFontSize(10);
                doc.text("Merci pour votre visite!", 105, 280, { align: 'center' });
                doc.save(`invoice_${order._id}.pdf`);
            });
    };

    const filteredOrders = useMemo(() => {
        return orders.filter(order =>
            order.client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.client.telephone.includes(searchTerm)
        );
    }, [orders, searchTerm]);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const currentOrders = useMemo(() => {
        if (!filteredOrders) return [];
        return filteredOrders.slice(startIndex, endIndex);
    }, [filteredOrders, startIndex, endIndex]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    const [totals, setTotals] = useState<{ [orderId: string]: { subtotal: number; totalPayments: number; remaining: string } }>({});

    // New effect to calculate totals whenever orders change
    useEffect(() => {
        const calculateTotals = async () => {
            const newTotals: { [orderId: string]: { subtotal: number; totalPayments: number; remaining: string } } = {};
            for (const order of orders) {
                const subtotal = calculateOrderSubtotal(order.produits);
                const totalPayments = await calculateTotalPayments(order._id);
                const remaining = calculateTotalDue(subtotal, totalPayments, order.remiseGlobale || 0); // Handle undefined
                newTotals[order._id] = { subtotal, totalPayments, remaining };
            }
            setTotals(newTotals);
        };
        calculateTotals();

    }, [orders]);

    const updateOrderStatus = useCallback(
        async (orderId: string) => {
            try {
                await axiosInstance.put(`api/commandes/active/${orderId}`);
                // Instead of re-fetching all orders, update the local state
                setOrders(prevOrders =>
                    prevOrders.map(order =>
                        order._id === orderId ? { ...order, status: !order.status } : order
                    )
                );
                toast({ title: "Succès", description: "Statut de la commande mis à jour." });
            } catch (error) {
                console.error("Error updating order status:", error);
                toast({ title: "Erreur", description: "Impossible de mettre à jour le statut de la commande.", variant: "destructive" });
            }
        },
        [toast]
    );

    const deleteOrder = useCallback(async (orderId: string) => {
        try {
            await axiosInstance.delete(`api/commandes/${orderId}`);
            //  update the local state after a successful deletion
            setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
            toast({ title: "Success", description: "Order deleted successfully." });

        } catch (error) {
            console.error("Error deleting order:", error);
            toast({ title: "Error", description: "Failed to delete order.", variant: "destructive" });
        }
    }, [toast]);

    // Function to fetch and set payments for the selected order
    const fetchAndSetPayments = useCallback(async (orderId: string) => {
        try {
            const response = await axiosInstance.get<Payment[]>(`/api/paiements/commande/${orderId}`);
            setSelectedOrderPayments(response.data);
        } catch (error) {
            console.error("Error fetching payments:", error);
            toast({
                title: "Error",
                description: "Failed to fetch payments for the selected order.",
                variant: "destructive",
            });
            setSelectedOrderPayments([]); // Reset to empty array on error
        }
    }, [toast]);

    // Call fetchAndSetPayments when the dialog opens and an order is selected
    useEffect(() => {
        if (selectedOrder) {
            fetchAndSetPayments(selectedOrder._id);
        }
    }, [selectedOrder, fetchAndSetPayments]);

    return (
        <>
            <Header />
            <div className="container py-8">
                <h1 className="text-3xl font-semibold mb-6">Liste des Commandes</h1>
                <div className="mb-4">
                    <Input
                        placeholder="Rechercher par nom de client, téléphone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                    />
                </div>
                {loading ? (
                    <p>Loading orders...</p>
                ) : (
                    <Card>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap">N° Commande</TableHead>
                                            <TableHead>Client</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="text-right">Paiements</TableHead>
                                            <TableHead className="text-right">Reste à payer</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentOrders.length > 0 ? (
                                            currentOrders.map((order) => {
                                                const { subtotal = 0, totalPayments = 0, remaining = '0.00' } = totals[order._id] || {};
                                                return (
                                                    <TableRow key={order._id}>
                                                        <TableCell className="whitespace-nowrap">
                                                            ORD-{order._id.substring(order._id.length - 6)}
                                                        </TableCell>
                                                        <TableCell>{order.client.nom}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(subtotal)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(totalPayments)}</TableCell>

                                                        <TableCell className={`text-right ${remaining === '0.00' ? 'text-green-500' : 'text-red-500'}`}>
                                                            {formatCurrency(parseFloat(remaining))}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            {order.status ? (
                                                                <span className="text-green-500">Payée</span>
                                                            ) : (
                                                                <span className="text-yellow-500">En attente</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right space-x-2">
                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button
                                                                        variant="outline"
                                                                        size="icon"
                                                                        title="Voir les détails"
                                                                        onClick={() => setSelectedOrder(order)}
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Détails de la Commande</DialogTitle>
                                                                        <DialogDescription>
                                                                            Commande N°: ORD-{selectedOrder?._id.substring(selectedOrder?._id.length - 6)}
                                                                            <br />
                                                                            Client : {selectedOrder?.client.nom}

                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    {/* Order details */}
                                                                    {selectedOrder && (
                                                                        <div className="space-y-4">

                                                                            {/* Client Information */}
                                                                            <Card className="border rounded-md p-4">
                                                                                <CardHeader>
                                                                                    <CardTitle className='text-lg'> Information Client</CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent>
                                                                                    <p><span className="font-medium">Nom:</span> {selectedOrder.client.nom}</p>
                                                                                    <p><span className="font-medium">Adresse:</span> {selectedOrder.client.adresse}</p>
                                                                                    <p><span className="font-medium">Téléphone:</span> {selectedOrder.client.telephone}</p>
                                                                                </CardContent>
                                                                            </Card>

                                                                            {/* Order Items */}
                                                                            <Card>
                                                                                <CardHeader>
                                                                                    <CardTitle className="text-lg">Articles de la commande</CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent>
                                                                                    <div className="rounded-md border overflow-x-auto">
                                                                                        <Table>
                                                                                            <TableHeader>
                                                                                                <TableRow>
                                                                                                    <TableHead>Produit</TableHead>
                                                                                                    <TableHead className="text-right">Quantité</TableHead>
                                                                                                    <TableHead className="text-right">Prix Unitaire</TableHead>
                                                                                                    <TableHead className="text-right">Remise</TableHead>
                                                                                                    <TableHead className="text-right">Total</TableHead>
                                                                                                </TableRow>
                                                                                            </TableHeader>
                                                                                            <TableBody>
                                                                                                {selectedOrder.produits?.map((item) => (
                                                                                                    <TableRow key={item.produit._id}>
                                                                                                        <TableCell>{item.produit.nom}</TableCell>
                                                                                                        <TableCell className="text-right">{item.quantite}</TableCell>
                                                                                                        <TableCell className="text-right">{formatCurrency(item.produit.prix)}</TableCell>
                                                                                                        <TableCell className="text-right">{item.remise}%</TableCell>
                                                                                                        <TableCell className="text-right">
                                                                                                            {formatCurrency(item.produit.prix * item.quantite * (1 - (item.remise) / 100))}
                                                                                                        </TableCell>
                                                                                                    </TableRow>
                                                                                                ))}
                                                                                            </TableBody>
                                                                                        </Table>
                                                                                    </div>
                                                                                </CardContent>

                                                                            </Card>
                                                                              {/* Payments Display */}
                                                                            <Card>
                                                                                <CardHeader>
                                                                                    <CardTitle className="text-lg">Paiements</CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent>
                                                                                    <div className="rounded-md border overflow-x-auto">
                                                                                        <Table>
                                                                                            <TableHeader>
                                                                                                <TableRow>
                                                                                                    <TableHead>Méthode</TableHead>
                                                                                                    <TableHead className="text-right">Montant</TableHead>
                                                                                                    <TableHead>Caisse</TableHead> {/* Added Caisse column */}
                                                                                                </TableRow>
                                                                                            </TableHeader>
                                                                                            <TableBody>
                                                                                                {selectedOrderPayments.length > 0 ? (
                                                                                                    selectedOrderPayments.map((payment) => (
                                                                                                        <TableRow key={payment._id}>
                                                                                                            <TableCell>{payment.methode}</TableCell>
                                                                                                            <TableCell className="text-right">{formatCurrency(payment.montant)}</TableCell>
                                                                                                            <TableCell>{payment.caisse}</TableCell>
                                                                                                        </TableRow>
                                                                                                    ))
                                                                                                ) : (
                                                                                                    <TableRow>
                                                                                                        <TableCell colSpan={3} className="text-center">Aucun paiement trouvé.</TableCell>
                                                                                                    </TableRow>
                                                                                                )}
                                                                                            </TableBody>
                                                                                        </Table>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                              {/* Payments moved to separate page, so just link to it  
                                                                            <Card>
                                                                                <CardContent>
                                                                                    <Link to={`/orders/${selectedOrder._id}/payments`}>
                                                                                        <Button variant="outline">Voir les paiements</Button>
                                                                                    </Link>
                                                                                </CardContent>
                                                                            </Card>
                                                                            */}

                                                                            <Card>
                                                                                <CardContent>
                                                                                    Summary
                                                                                    <div className="mt-4 p-4  rounded-md ">
                                                                                        <div className="space-y-2">
                                                                                            <div className="flex justify-between">
                                                                                                <span>Sous-Total:</span>
                                                                                                <span className="font-medium">{formatCurrency(calculateOrderSubtotal(selectedOrder.produits))}</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between">
                                                                                                <span>Remise Globale:</span>
                                                                                                <span className="font-medium">{selectedOrder.remiseGlobale || 0}%</span>
                                                                                            </div>
                                                                                            {/* <div className="flex justify-between"> //Removed.
                                                                                <span>Total Paiements:</span>
                                                                                <span className="font-medium">{formatCurrency(calculateTotalPayments(selectedOrder.payments))}</span>
                                                                            </div> */}

                                                                                            <div className="border-t pt-2 mt-2 flex justify-between">
                                                                                                <span>Reste à payer:</span>
                                                                                                <span className={`font-bold ${parseFloat(remaining) <= 0.001 ? 'text-green-600' : 'text-red-500'}`}>
                                                                                                    {remaining}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>
                                                                        </div>
                                                                    )}
                                                                    <DialogFooter>
                                                                        <DialogClose asChild>
                                                                            <Button type="button" variant="secondary">
                                                                                Fermer
                                                                            </Button>
                                                                        </DialogClose>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                            {/* Edit Order Button */}
                                                            <Button variant="outline" size="icon" title="Modifier la commande" onClick={() => navigate(`/orders/edit/${order._id}`)} >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>

                                                            {/* Edit Payments Button */}
                                                            <Button
                                                                variant="outline"
                                                                size="icon"
                                                                title="Modifier les paiements"
                                                                onClick={() => navigate(`/orders/${order._id}/payments`)}
                                                            >
                                                                <CreditCard className="h-4 w-4" />
                                                            </Button>

                                                        

                                                            <Button variant="outline" size="icon" title="Imprimer la facture" onClick={() => handlePdf(order)}>
                                                                <Printer className="h-4 w-4" />
                                                            </Button>

                                                            <Dialog>
                                                                <DialogTrigger asChild>
                                                                    <Button variant="destructive" size="icon" title="Supprimer la commande">
                                                                        <Trash2 className='h-4 w-4' />
                                                                    </Button>
                                                                </DialogTrigger>
                                                                <DialogContent>
                                                                    <DialogHeader>
                                                                        <DialogTitle>Êtes-vous sûr(e) ?</DialogTitle>
                                                                        <DialogDescription>
                                                                            Voulez-vous vraiment supprimer cette commande ?  Cette action est irréversible.
                                                                        </DialogDescription>
                                                                    </DialogHeader>
                                                                    <DialogFooter>
                                                                        <DialogClose asChild>
                                                                            <Button variant="secondary">Cancel</Button>
                                                                        </DialogClose>
                                                                        <Button variant="destructive" onClick={() => deleteOrder(order._id)}>
                                                                            Delete
                                                                        </Button>
                                                                    </DialogFooter>
                                                                </DialogContent>
                                                            </Dialog>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center">Aucune commande trouvée.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {filteredOrders.length > itemsPerPage && (
                                <div className="flex justify-center mt-4 space-x-2">
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === 1}
                                        onClick={() => handlePageChange(currentPage - 1)}
                                    >
                                        Previous
                                    </Button>
                                    <span>
                                        Page {currentPage} of {Math.ceil(filteredOrders.length / itemsPerPage)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                                        onClick={() => handlePageChange(currentPage + 1)}
                                    >
                                        Next
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
};

export default OrderListPage;
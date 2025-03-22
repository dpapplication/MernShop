import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Printer, Pencil, Trash2, CheckCircle, Eye, CreditCard } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog"
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'
import axiosInstance from '@/utils/axiosInstance';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


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
        prix: number;
        quantite: number;
        remise: number;
    }[];
    services: {
        service: {
            _id: string;
            nom: string;
            prix: number;
        };
        prix: number,
        remise: number;
    }[];
    remiseGlobale?: number;
    date: string;
    description: string;
    status: boolean;
}

interface Payment {
    _id: string;
    montant: number;
    methode: string;
}

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

// Updated formatDate function
const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const year = date.getFullYear();
    return `${day}-${month}-${year}`; // DD/MM/YYYY format
};

const calculateProductsSubtotal = (orderItems: Order['produits'] | undefined): number => {
    if (!orderItems) return 0;
    return orderItems.reduce((total, item) => {
        return total + (item.prix * item.quantite - (item.remise || 0));
    }, 0);
};

const calculateServicesSubtotal = (orderServices: Order['services'] | undefined): number => {
    if (!orderServices) return 0;
    return orderServices.reduce((total, item) => {
        return total + (item.prix - (item.remise || 0));
    }, 0);
};

const calculateTotalPayments = async (orderId: string): Promise<number> => {
    try {
        const response = await axiosInstance.get<Payment[]>(`/api/paiements/commande/${orderId}`);
        const payments = response.data;

        if (!payments || payments.length === 0) {
            return 0;
        }

        return payments.reduce((total, payment) => total + payment.montant, 0);
    } catch (error) {
        console.error("Error fetching payments:", error);
        return 0;
    }
};

const calculateTotalDue = (productsSubtotal: number, servicesSubtotal: number, totalPayments: number, globalDiscount: number = 0): string => {
    const total = productsSubtotal + servicesSubtotal;
    const discountedSubtotal = total - globalDiscount;
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
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedOrderPayments, setSelectedOrderPayments] = useState<Payment[]>([]);
    const [searchDate, setSearchDate] = useState('');


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

        doc.setFontSize(20);
        doc.text("Le Mobile", 14, 20);
        doc.setFontSize(10);
        doc.text("57 Avenue Alphonse Denis", 14, 27);
        doc.text("83400 Hyères", 14, 34);
        doc.text("Tel:0980496621", 14, 41);
        doc.text("Siret: 948 058 383 00019", 14, 48);
        doc.text("e-mail: yassmobile83@gmail.com", 14, 55);
        const logoImg = new Image()
        logoImg.src = './logo.jpeg'
        doc.addImage(logoImg, 'JPEG', 150, 15, 45, 45)

        doc.setFontSize(25);
        doc.text("Facture", 108, 60, { align: 'center' });

        doc.setFontSize(12);
        doc.text(`N° Commande: ORD-${order._id.substring(order._id.length - 6)}`, 14, 75);
        doc.text(`Date: ${formatDate(order.date)}`, 14, 82);

        if (order.client) {
            doc.setFontSize(14);
            doc.text("Information du client:", 14, 95);
            doc.setFontSize(12);
            doc.text(`Nom : ${order.client.nom}`, 14, 102);
            doc.text(`Addresse: ${order.client.adresse}`, 14, 109);
           
        }

        // Products Table
        const productItems = order.produits?.map((item) => [
            item.produit.nom,
            item.quantite,
            item.prix,
            `${item.remise}`,
            (item.prix * item.quantite - (item.remise || 0))
        ]) || [];

        const productColumns = ["Produit", "Quantité", "Prix Unitaire", "Remise", "Total"];

        autoTable(doc, {
            head: [productColumns],
            body: productItems,
            startY: 127,
            headStyles: { fillColor: [41, 128, 185] },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' },
            },
            margin: { top: 10, right: 14, bottom: 10, left: 14 },
            theme: 'striped',
        });

        // Services Table (if services exist)
        if (order.services && order.services.length > 0) {
            const serviceItems = order.services.map(item => [
                item.service.nom,
                item.prix,
                `${item.remise}`,
                (item.service.prix - (item.remise || 0)) // Total for service
            ]);
            const serviceColumns = ["Service", "Prix", "Remise", "Total"];

            let startY = (doc as any).lastAutoTable.finalY + 15;
            autoTable(doc, {
                head: [serviceColumns],
                body: serviceItems,
                startY: startY,
                headStyles: { fillColor: [41, 128, 185] },
                columnStyles: {
                    1: { halign: 'right' },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                theme: 'striped',
            });
        }
       let startY = (doc as any).lastAutoTable.finalY + 7;
        doc.setFontSize(11);
        if(order.description)
        doc.text(`description :MUI ${order.description}`, 14, startY);

        // --- Get Payments ---
        axiosInstance.get(`/api/paiements/commande/${order._id}`)
            .then(paymentsResponse => {
                const payments = paymentsResponse.data;
                // --- Payment details ---
                if (payments && payments.length > 0) {
                    let startY = (doc as any).lastAutoTable.finalY + 15; // Cast doc to any to access lastAutoTable
                    doc.setFontSize(14);
                    doc.text("Paiement:", 14, startY);
                    startY += 7;
                    const paymentsData = payments.map((payment) => [
                        payment.methode,
                        payment.montant, // format currency
                    ]);

                    autoTable(doc, {
                        head: [['Type de paiement', 'Montant']],
                        body: paymentsData,
                        startY: startY,
                        headStyles: { fillColor: [41, 128, 185] },
                        columnStyles: { 1: { halign: 'right' } },
                        margin: { left: 14 },
                    });
                }
                const productsSubtotal = calculateProductsSubtotal(order.produits);
                const servicesSubtotal = calculateServicesSubtotal(order.services);
                const totalPayments = calculateTotalPayments(order._id);
                const remiseGlobale = order.remiseGlobale || 0;

                let startY = (doc as any).lastAutoTable.finalY + 15;
                doc.setFontSize(12);
                doc.text(`Total Produits: ${productsSubtotal}€`, 14, startY, { align: 'left' });
                startY += 7;
                doc.text(`Total Service: ${servicesSubtotal}€`, 14, startY, { align: 'left' });
                startY += 7;

                if (order.remiseGlobale) {
                    doc.text(`Remise: ${order.remiseGlobale}`, 14, startY, { align: 'left' });
                    startY += 7;
                }
                totalPayments.then(total => { // totalPayments is a Promise
                    doc.text(`Total: ${total}€`, 14, startY, { align: 'left' });
                    startY += 7;
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    const totalDue = calculateTotalDue(productsSubtotal, servicesSubtotal, total, order.remiseGlobale);
                    doc.text(`Reste à payer: ${totalDue}`, 14, startY, { align: 'left' });
                    doc.setFont('helvetica', 'normal');
                    startY += 7;
                    doc.setFontSize(11);
                    doc.text(`Tva non applicable art 293 B.`, 14, startY, { align: 'left' });
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(10);
                    doc.text("Merci pour votre visite!", 105, 280, { align: 'center' });
                    doc.save(`invoice_${order._id}.pdf`);

                });
            })
            .catch(error => {
                console.error("Error fetching payments for PDF:", error);
                doc.setFontSize(10);
                doc.text("Merci pour votre visite!", 105, 280, { align: 'center' });
                doc.save(`invoice_${order._id}.pdf`); // Still save the PDF, even with payment error
            });
    };

   const filteredOrders = useMemo(() => {
   
    return orders.filter(order => {
        const clientNameMatch = order.client.nom.toLowerCase().includes(searchTerm.toLowerCase());
        // Use the formatted date for searching, and compare with the input date string.
        const formattedOrderDate = formatDate(order.date);
        const dateMatch = !searchDate || formattedOrderDate.includes(formatDate(searchDate));
        return clientNameMatch && dateMatch;
    });
}, [orders, searchTerm, searchDate]);


    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    const currentOrders = useMemo(() => {
        if (!filteredOrders) return [];
        return filteredOrders.slice(startIndex, endIndex);
    }, [filteredOrders, startIndex, endIndex]);


    const handleItemsPerPageChange = (value: string) => {  // Changed to accept string value
        const newItemsPerPage = parseInt(value, 10);
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const [totals, setTotals] = useState<{ [orderId: string]: { productsSubtotal: number; servicesSubtotal: number; totalPayments: number; remaining: string; } }>({});

    useEffect(() => {
        const calculateTotals = async () => {
            const newTotals: { [orderId: string]: { productsSubtotal: number; servicesSubtotal: number; totalPayments: number; remaining: string; } } = {};
            for (const order of orders) {
                const productsSubtotal = calculateProductsSubtotal(order.produits);
                const servicesSubtotal = calculateServicesSubtotal(order.services);
                const totalPayments = await calculateTotalPayments(order._id);
                const remaining = calculateTotalDue(productsSubtotal, servicesSubtotal, totalPayments, order.remiseGlobale || 0);
                newTotals[order._id] = { productsSubtotal, servicesSubtotal, totalPayments, remaining };
            }
            setTotals(newTotals);
        };
        calculateTotals();

    }, [orders]);


    const updateOrderStatus = useCallback(
        async (orderId: string) => {
            try {
                await axiosInstance.put(`api/commandes/active/${orderId}`);
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
            setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
            toast({ title: "Success", description: "Order deleted successfully." });

        } catch (error) {
            console.error("Error deleting order:", error);
            toast({ title: "Error", description: "Failed to delete order.", variant: "destructive" });
        }
    }, [toast]);

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
            setSelectedOrderPayments([]);
        }
    }, [toast]);


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
                <div className="mb-4 flex flex-col md:flex-row gap-4 items-center">
                    <Input
                        placeholder="Rechercher par nom de client..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 w-full md:w-1/3"
                    />
                    <Input
                         type="date"
                        placeholder="Rechercher par date..."
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 w-full md:w-1/3"
                    />

                    {/* Items Per Page Selection - Using Shadcn UI */}
                    <div className="w-full md:w-auto">
                        <Select onValueChange={handleItemsPerPageChange} value={String(itemsPerPage)}>
                            <SelectTrigger className="w-full md:w-[180px]">
                                <SelectValue placeholder="Commandes par page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                                            <TableHead>Date</TableHead>
                                            <TableHead className="text-right">Total Produits</TableHead>
                                            <TableHead className="text-right">Total Services</TableHead>
                                            <TableHead className="text-right">Paiements</TableHead>
                                            <TableHead className="text-right">Reste à payer</TableHead>
                                            <TableHead className="text-right">Status</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {currentOrders.length > 0 ? (
                                            currentOrders.map((order) => {
                                                const { productsSubtotal = 0, servicesSubtotal = 0, totalPayments = 0, remaining = '0.00' } = totals[order._id] || {};
                                                return (
                                                    <TableRow key={order._id}>
                                                        <TableCell className="whitespace-nowrap">
                                                            ORD-{order._id.substring(order._id.length - 6)}
                                                        </TableCell>
                                                        <TableCell>{order.client.nom}</TableCell>
                                                        <TableCell>{formatDate(order.date)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(productsSubtotal)}</TableCell>
                                                        <TableCell className="text-right">{formatCurrency(servicesSubtotal)}</TableCell>
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
                                                                    {selectedOrder && (
                                                                        <div className="space-y-4">
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

                                                                            {/* Products Display */}
                                                                            <Card>
                                                                                <CardHeader>
                                                                                    <CardTitle className="text-lg">Articles de la commande (Produits)</CardTitle>
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

                                                                            {/* Services Display */}
                                                                            <Card>
                                                                                <CardHeader>
                                                                                    <CardTitle className="text-lg">Services de la commande</CardTitle>
                                                                                </CardHeader>
                                                                                <CardContent>
                                                                                    <div className="rounded-md border overflow-x-auto">
                                                                                        <Table>
                                                                                            <TableHeader>
                                                                                                <TableRow>
                                                                                                    <TableHead>Service</TableHead>
                                                                                                    <TableHead className="text-right">Prix Unitaire</TableHead>
                                                                                                    <TableHead className="text-right">Remise</TableHead>
                                                                                                    <TableHead className="text-right">Total</TableHead>
                                                                                                </TableRow>
                                                                                            </TableHeader>
                                                                                            <TableBody>
                                                                                                {selectedOrder.services?.map((item) => (
                                                                                                    <TableRow key={item.service._id}>
                                                                                                        <TableCell>{item.service.nom}</TableCell>
                                                                                                        <TableCell className="text-right">{formatCurrency(item.service.prix)}</TableCell>
                                                                                                        <TableCell className="text-right">{item.remise}%</TableCell>
                                                                                                        <TableCell className="text-right">
                                                                                                            {formatCurrency(item.service.prix * (1 - (item.remise) / 100))}
                                                                                                        </TableCell>
                                                                                                    </TableRow>
                                                                                                ))}
                                                                                            </TableBody>
                                                                                        </Table>
                                                                                    </div>
                                                                                </CardContent>
                                                                            </Card>

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
                                                                                                    <TableHead>Caisse</TableHead>
                                                                                                </TableRow>
                                                                                            </TableHeader>
                                                                                            <TableBody>
                                                                                                {selectedOrderPayments.length > 0 ? (
                                                                                                    selectedOrderPayments.map((payment) => (
                                                                                                        <TableRow key={payment._id}>
                                                                                                            <TableCell>{payment.methode}</TableCell>
                                                                                                            <TableCell className="text-right">{formatCurrency(payment.montant)}</TableCell>
                                                                                                            <TableCell>{payment._id}</TableCell>
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


                                                                            <Card>
                                                                                <CardContent>
                                                                                    Summary
                                                                                    <div className="mt-4 p-4  rounded-md ">
                                                                                        <div className="space-y-2">
                                                                                            <div className="flex justify-between">
                                                                                                <span>Sous-Total Produits:</span>
                                                                                                <span className="font-medium">{formatCurrency(calculateProductsSubtotal(selectedOrder.produits))}</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between">
                                                                                                <span>Sous-Total Services:</span>
                                                                                                <span className="font-medium">{formatCurrency(calculateServicesSubtotal(selectedOrder.services))}</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between">
                                                                                                <span>Remise Globale:</span>
                                                                                                <span className="font-medium">{selectedOrder.remiseGlobale || 0}%</span>
                                                                                            </div>
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
                                                            <Button variant="outline" size="icon" title="Modifier la commande" onClick={() => navigate(`/orders/edit/${order._id}`)} >
                                                                <Pencil className="h-4 w-4" />
                                                            </Button>

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
                                                <TableCell colSpan={9} className="text-center">Aucune commande trouvée.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {/* Pagination Controls */}
                            {filteredOrders.length > 0 && (
                                <div className="flex justify-center mt-4 space-x-2">
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    >
                                        Précédent
                                    </Button>
                                    <span>
                                        Page {currentPage} sur {Math.ceil(filteredOrders.length / itemsPerPage)}
                                    </span>
                                    <Button
                                        variant="outline"
                                        disabled={currentPage === Math.ceil(filteredOrders.length / itemsPerPage)}
                                        onClick={() => setCurrentPage(prev => prev + 1)}
                                    >
                                        Suivant
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
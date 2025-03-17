import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Removed:  Eye,   CheckCircle (unused)
import { Printer, Pencil, XCircle, Trash2, CheckCircle, Eye } from 'lucide-react';  //Keep lucide-icons.
import { useToast } from '@/components/ui/use-toast';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/layout/Header';
import { Dialog, DialogTrigger, DialogContent, DialogClose, DialogTitle, DialogDescription, DialogFooter, DialogHeader } from "@/components/ui/dialog" //Keep dialog.
import jsPDF from 'jspdf';         //
import autoTable from 'jspdf-autotable' // Import
import axiosInstance from '@/utils/axiosInstance';

// --- Interface ---
interface Order {
  _id: string;
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
      prix: number | string; // price as number | string.
        stock:number;
    };
    quantite: string;
    remise: string;
  }[];
  payments?: {
    id: string;
    typePaiement: string;
    montant: string ; //Keep as string to showing
  }[];
    remiseGlobale?: string;
  date: string;
  updatedAt: string;
  status?: string; // "pending", "completed", "cancelled"...
}

// --- Helper Functions ---
const formatCurrency = (value: string | number) => {
   const numValue = typeof value === 'string' ? parseFloat(value) : value;
   if (isNaN(numValue)) {
     return "Invalid Input";
   }
   return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(numValue);
  };

//Keep like string.
const calculateOrderSubtotal = (orderItems: Order['produits']) => {
    if(!orderItems) return 0;
    return orderItems.reduce((total, item) => {
        const price = parseFloat(item.produit.prix.toString());
        const quantity = parseInt(item.quantite);
        const discount = parseFloat(item.remise) || 0; // Handle undefined/null discount.
        return total + (price * quantity * (1- discount/ 100));
    }, 0);
};

const calculateTotalPayments = (payments: Order['payments']) => {
   if (!payments) return 0;
    return payments.reduce((total, payment) => {
        // Ensure amount is valid before parsing
      return total + parseFloat(payment.montant);
    }, 0);
};
// NEW: Calculate total due considering global discount
const calculateTotalDue = (orderItems: Order['produits'], payments: Order['payments'], globalDiscount: string = '0') => {
  const subtotal = calculateOrderSubtotal(orderItems);
  const totalPayments = parseFloat(calculateTotalPayments(payments));
  const discount = parseFloat(globalDiscount) || 0;  // Handle null/undefined
  const discountedSubtotal = subtotal * (1 - discount / 100);
  return (discountedSubtotal - totalPayments).toFixed(2); // Format to two decimal places
};
// --- Component ---
const OrderListPage = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null); // For modal and print
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;


      // --- Data Fetching ---
    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get<Order[]>(`api/commandes`);
            setOrders(response.data);
              console.log(response.data)
        }
        catch (error) {
            console.error("Error fetching orders:", error);
            toast({
                title: "Erreur", description: "Impossible de charger les commandes.", variant: "destructive"
            });
        }
        finally {
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
            doc.text("Client Information:", 14, 95);
            doc.setFontSize(12);
            doc.text(`Name: ${order.client.nom}`, 14, 102);
            doc.text(`Address: ${order.client.adresse}`, 14, 109);
            doc.text(`Phone: ${order.client.telephone}`, 14, 116);
        }

          // --- Horizontal Line ---
        doc.setLineWidth(0.5);
        doc.line(14, 125, 196, 125);  // (x1, y1, x2, y2)


       const items = order.produits?.map((item, index) => [
              item.produit.nom,
              item.quantite,
              item.produit.prix,
              `${item.remise}%`,
              (parseFloat(item.produit.prix.toString()) * parseInt(item.quantite) * (1- (parseFloat(item.remise) || 0)/100))
         ]);

            const columns = ["Produit", "Quantité", "Prix Unitaire", "Remise", "Total"];

            // Add the table with products to the PDF using jsPDF-AutoTable
            autoTable(doc, {
                head: [columns],
                body: items,
                startY: 130,
                 headStyles: {fillColor: [41, 128, 185]},  //  header styling
                columnStyles: {  // Right-align numeric columns for readability.
                    1: { halign: 'right' },  // Quantity
                    2: { halign: 'right' },  // Unit Price
                    3: { halign: 'right' }, //Remise
                    4: { halign: 'right' }, // Total
                },
                margin: { top: 10, right: 14, bottom: 10, left: 14 },
                 theme: 'striped', // Apply a theme for styling (optional)
            });

           // --- Payment details ---
          if (order.payments && order.payments.length > 0){
          let startY = (doc as any).lastAutoTable.finalY + 15; // Cast doc to any to access lastAutoTable
           doc.setFontSize(14);
           doc.text("Payments:", 14, startY);
            startY+=7;
            const paymentsData = order.payments.map((payment) => [
            payment.typePaiement,
           payment.montant, // format currency
           ]);

          autoTable(doc, {
            head: [['Payment Type', 'Amount']], //
            body: paymentsData, // Use data for display payments details
            startY: startY,
            headStyles: {fillColor: [41, 128, 185]},
            columnStyles: { 1: { halign: 'right' } },
            margin: { left: 14 },
          });
     }
        const orderTotal =  calculateOrderSubtotal(order.produits);
        const totalPayments = calculateTotalPayments(order.payments);
        const remainingAmount = (orderTotal - totalPayments).toFixed(2);
        const remiseGlobale = parseFloat(order.remiseGlobale || '0');
        const discountedSubtotal = (orderTotal * (1- remiseGlobale/100 )).toFixed(2)

       let startY = (doc as any).lastAutoTable.finalY + 15; // Cast doc to any to access lastAutoTable
        doc.setFontSize(12);
        doc.text(`Subtotal: ${orderTotal}`, 196, startY, { align: 'right' });
        startY += 7;

           // Global Discount
            if (order.remiseGlobale) {
            doc.text(`Order Discount: ${order.remiseGlobale}%`, 196, startY, { align: 'right' });
            startY += 7;
          }
        doc.text(`Total Payments: ${totalPayments}`, 196, startY, { align: 'right' });
         startY += 7;
          // Add total in bold
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold'); // Set font to bold

        doc.text(`Remaining Balance: ${ calculateTotalDue(order.produits,order.payments, order.remiseGlobale)}`, 196, startY, { align: 'right' });
        doc.setFont('helvetica', 'normal');// Reset to normal

            // Footer
            doc.setFontSize(10);
            doc.text("Merci pour votre visite!", 105, 280, { align: 'center' });
        doc.save(`invoice_${order._id}.pdf`); // Use backticks for template literals

     };

     const filteredOrders = useMemo(() => {
            return orders.filter(order =>
            order.client?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.client?.telephone.includes(searchTerm)
            );
        }, [orders, searchTerm]);
        // --- Pagination ---
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

          const currentOrders = useMemo(() => {
                if(!filteredOrders) return []
                return filteredOrders.slice(startIndex, endIndex);
            }, [filteredOrders, startIndex, endIndex]);


  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

    // Function to update order status
  const updateOrderStatus = useCallback(
    async (orderId: string) => {
      try {
        await axiosInstance.put(`api/commandes/active/${orderId}`)
       
        fetchOrders();
        toast({
          title: "Succès",
          description: "Statut de la commande mis à jour.",
        });
      } catch (error) {
        console.error("Error updating order status:", error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour le statut de la commande.",
          variant: "destructive",
        });
      }
    },
    [ fetchOrders, toast]
  );

    // New delete function with confirmation
    const deleteOrder = useCallback(async (orderId: string) => {
    try {
        await axiosInstance.delete(`api/commandes/${orderId}`);
        fetchOrders(); // Re-fetch to update the list
        toast({ title: "Success", description: "Order deleted successfully." });

    }  catch (error) {
        console.error("Error deleting order:", error);
        toast({
          title: "Error", description: "Failed to delete order.", variant: "destructive" });
    }
    }, [ fetchOrders, toast]); // Add fetchOrders to dependencies

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
                         const orderTotal = calculateOrderSubtotal(order.produits);
                         const totalPayments = calculateTotalPayments(order.payments);
                         const remainingAmount = (orderTotal - totalPayments).toFixed(2);

                        return (
                        <TableRow key={order._id}>
                            <TableCell className="whitespace-nowrap">
                            ORD-{order._id.substring(order._id.length - 6)}
                            </TableCell>
                            <TableCell>{order.client?.nom}</TableCell>
                            <TableCell className="text-right">{formatCurrency(orderTotal)}</TableCell>
                            <TableCell className="text-right">{formatCurrency(totalPayments)}</TableCell>
                            <TableCell className={`text-right ${remainingAmount === '0.00' ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(remainingAmount)}
                            </TableCell>
                            <TableCell className="text-right">
                            {order.status  ? (
                                <span className="text-green-500">Payée</span>
                            ) :  (
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
                                    <br/>
                                     Client : {selectedOrder?.client?.nom}

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
                                            <p><span className="font-medium">Nom:</span> {selectedOrder.client?.nom}</p>
                                            <p><span className="font-medium">Adresse:</span> {selectedOrder.client?.adresse}</p>
                                             <p><span className="font-medium">Téléphone:</span> {selectedOrder.client?.telephone}</p>
                                       </CardContent>
                                     </Card>

                                 {/* Order Items */}
                                <Card>
                                <CardHeader>
                                        <CardTitle className="text-lg">Articles de la commande</CardTitle>
                                    </CardHeader>
                                        <CardContent>
                                      <div className="rounded-md border overflow-x-auto"> {/* Added overflow-x-auto */}
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
                                               {formatCurrency((parseFloat(item.produit.prix.toString()) * parseInt(item.quantite) * (1- (parseFloat(item.remise) || 0)/100)))}
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
                                    <CardTitle className='text-lg'>Paiements</CardTitle>

                                     </CardHeader>
                                <CardContent>
                              <div className='rounded-md border overflow-x-auto'>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Type de Paiement</TableHead>
                                      <TableHead className='text-right'>Montant </TableHead>
                                     </TableRow>
                            </TableHeader>
                           <TableBody>
                            {selectedOrder.payments?.map((payment) => (
                                        <TableRow key={payment.id}>  {/* Use payment.id */}
                                          <TableCell>{payment.typePaiement}</TableCell>
                                           <TableCell className="text-right">{formatCurrency(payment.montant)}</TableCell>
                                        </TableRow>
                                      ))}
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
                                                    <span>Sous-Total:</span>
                                                    <span className="font-medium">{formatCurrency(calculateOrderSubtotal(selectedOrder.produits))}</span>
                                                 </div>

                                                  {/* Add global discount display here if applicable */}
                                                    <div className="flex justify-between">
                                                  <span>Remise Globale:</span>
                                                 <span className="font-medium">{selectedOrder.remiseGlobale || '0'}%</span>  {/* Show discount */}
                                               </div>

                                          <div className="flex justify-between">
                                              <span>Total Paiements:</span>
                                            <span className="font-medium">{formatCurrency(calculateTotalPayments(selectedOrder.payments) )}</span>
                                          </div>
                                              <div className="border-t pt-2 mt-2 flex justify-between">
                                                 <span>Reste à payer:</span>
                                                  <span className={`font-bold ${  parseFloat(calculateTotalDue(selectedOrder.produits,selectedOrder.payments,selectedOrder.remiseGlobale)) <= 0.001
                                                      ? 'text-green-600'  // Correct class
                                                      : 'text-red-500'     // Correct class
                                                  }`}>
                                                        {formatCurrency(calculateTotalDue(selectedOrder.produits,selectedOrder.payments,selectedOrder.remiseGlobale))}
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

                {/* Edit Button */}
               <Button variant="outline" size="icon" title="Modifier la commande" onClick={() => navigate(`/orders/edit/${order._id}`)} >
                   <Pencil className="h-4 w-4" />
                 </Button>

                 {/* Status Toggle Button */}
                {order.status  ? (
                    <></>
                ) : (
                <Button variant="outline" size="icon"  title="Marquer comme payée"  onClick={() => updateOrderStatus(order._id)}  >
                <CheckCircle className="h-4 w-4" />
                </Button>
                )}

                {/* PDF Download Button - Uses handlePdf function now  */}
             <Button  variant="outline" size="icon" title="Imprimer la facture"   onClick={() => handlePdf(order)}>
                 <Printer className="h-4 w-4" />
              </Button>

              {/* Delete Button (with confirmation) */}
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
                         {/*  Actual deletion on confirm */}
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
               {/* Pagination Controls */}
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
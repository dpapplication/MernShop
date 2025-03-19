import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog, DialogContent, DialogClose, DialogTitle, DialogFooter, DialogHeader
} from "@/components/ui/dialog";
import axiosInstance from '@/utils/axiosInstance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import Header from '@/components/layout/Header';

// --- Interfaces ---
interface Caisse {
    _id: string;
    soldeinitiale: number;
    soldefinale: number | null;
    dateOuverture: string;
    isOpen: boolean;
}

interface Transaction {
    _id: string;
    montant: number;
    type: 'retrait' | 'depot';
    date: string;
    idCaisse: string;
    motif: string;
}

// Interface for Payments (assuming you have a payments API)
interface Payment {
    _id: string;
    commande: string; // Assuming you link payments to orders via an order ID
    montant: number;
    methode: string;
    date: string;
}

// --- Helper Functions ---
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
};

const CaisseListPage: React.FC = () => {
    const { toast } = useToast();
    const [caisses, setCaisses] = useState<Caisse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCaisseId, setSelectedCaisseId] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]); // State for payments
    const [paymentTotals, setPaymentTotals] = useState<{ [method: string]: number }>({}); // State for payment totals by method
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // --- Date Formatting ---
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd/MM/yyyy HH:mm", { locale: fr });
        } catch (error) {
            console.error("Invalid date string:", dateString, error);
            return "Invalid Date";
        }
    };

    // --- Data Fetching ---
    const fetchCaisses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get<Caisse[]>('/api/caisse/');
            setCaisses(response.data);
        } catch (error) {
            console.error("Error fetching caisses:", error);
            toast({ title: "Erreur", description: "Impossible de charger les caisses.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    const fetchTransactions = useCallback(async (caisseId: string) => {
        try {
            const response = await axiosInstance.get<Transaction[]>(`/api/transaction/caisse/${caisseId}`);
            setTransactions(response.data);
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast({ title: "Erreur", description: "Impossible de charger les transactions.", variant: "destructive" });
        }
    }, [toast]);

    // New function to fetch payments associated with a Caisse
    const fetchPayments = useCallback(async (caisseId: string) => {
        try {
            const response = await axiosInstance.get<Payment[]>(`/api/paiements/caisse/${caisseId}`); // Adjust endpoint as needed
            setPayments(response.data);

            // Calculate payment totals by method
            const totals: { [method: string]: number } = {};
            response.data.forEach(payment => {
                totals[payment.methode] = (totals[payment.methode] || 0) + payment.montant;
            });
            setPaymentTotals(totals);

        } catch (error) {
            console.error("Error fetching payments:", error);
            toast({ title: "Erreur", description: "Impossible de charger les paiements.", variant: "destructive" });
            setPayments([]); // Reset on error
            setPaymentTotals({}); // Reset on error
        }
    }, [toast]);


    const handleShowDetails = (caisseId: string) => {
        console.log(caisseId)
        setSelectedCaisseId(caisseId);
        fetchTransactions(caisseId);
        fetchPayments(caisseId); // Fetch payments
        setIsDialogOpen(true);
    };

    const handleCloseModal = () => {
        setIsDialogOpen(false);
        setSelectedCaisseId(null);
        setTransactions([]);
        setPayments([]); // Clear payments
        setPaymentTotals({});//Clear Payment Totals
    };

    useEffect(() => {
        fetchCaisses();
    }, [fetchCaisses]);

    const filteredCaisses = caisses.filter(caisse =>
        caisse.soldeinitiale.toString().includes(searchTerm) ||
        (caisse.soldefinale !== null && caisse.soldefinale.toString().includes(searchTerm)) ||
        formatDate(caisse.dateOuverture).includes(searchTerm)
    );

    return (
        <>
            <Header />
            <Card className="w-full">
                <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle className="text-xl">Liste des Caisses</CardTitle>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher par solde, date..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 w-full sm:w-[250px] focus:w-full sm:focus:w-[300px] transition-all duration-300"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-20"><p>Chargement...</p></div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead className="text-right">Solde Initial</TableHead>
                                        <TableHead className="text-right">Solde Final</TableHead>
                                        <TableHead>Date d'Ouverture</TableHead>
                                        <TableHead className="text-center">Statut</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredCaisses.length > 0 ? (
                                        filteredCaisses.map((caisse) => (
                                            <TableRow key={caisse._id}>
                                                <TableCell>{caisse._id}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(caisse.soldeinitiale)}</TableCell>
                                                <TableCell className="text-right">
                                                    {caisse.soldefinale !== null ? formatCurrency(caisse.soldefinale) : 'N/A'}
                                                </TableCell>
                                                <TableCell>{formatDate(caisse.dateOuverture)}</TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox checked={caisse.isOpen} disabled />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="outline" size="icon" title="Voir les détails" onClick={() => handleShowDetails(caisse._id)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">Aucune caisse trouvée.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Details Dialog */}
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Détails de la Caisse {selectedCaisseId}</DialogTitle>
                    </DialogHeader>

                    {/* Transactions Table */}
                    <Card className='mt-4'>
                       <CardHeader><CardTitle>Transactions</CardTitle></CardHeader>
                        <CardContent>
                            {transactions.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead className="text-right">Montant</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Motif</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {transactions.map((transaction) => (
                                            <TableRow key={transaction._id}>
                                                <TableCell>{transaction._id}</TableCell>
                                                 <TableCell className="text-right">
                                                    {transaction.type === 'depot'
                                                        ? `+${formatCurrency(transaction.montant)}`
                                                        : `-${formatCurrency(transaction.montant)}`
                                                    }
                                                </TableCell>
                                                <TableCell>{transaction.type}</TableCell>
                                                <TableCell>{transaction.motif}</TableCell>
                                                <TableCell>{formatDate(transaction.date)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p>Aucune transaction trouvée.</p>
                            )}
                        </CardContent>
                    </Card>
                       {/* Payments Table */}
                    <Card className='mt-4'>
                        <CardHeader><CardTitle>Paiements</CardTitle></CardHeader>
                        <CardContent>
                            {payments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            
                                            <TableHead>Commande ID</TableHead>
                                            <TableHead className="text-right">Montant</TableHead>
                                            <TableHead>Méthode</TableHead>
                                            <TableHead>Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment._id}>
                                                
                                                <TableCell>{payment.commande}</TableCell>
                                                 <TableCell className="text-right">{formatCurrency(payment.montant)}</TableCell>
                                                <TableCell>{payment.methode}</TableCell>
                                                <TableCell>{formatDate(payment.date)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <p>Aucun paiement trouvé pour cette caisse.</p>
                            )}
                        </CardContent>
                    </Card>

                      {/* Payment Totals */}
                    <Card className='mt-4'>
                        <CardHeader>
                            <CardTitle>Total des Paiements par Méthode</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {Object.keys(paymentTotals).length > 0 ? (
                                <Table>
                                    <TableHeader>
                                         <TableRow>
                                            <TableHead>Méthode</TableHead>
                                             <TableHead className="text-right">Total</TableHead>
                                         </TableRow>
                                     </TableHeader>
                                    <TableBody>
                                        {Object.entries(paymentTotals).map(([method, total]) => (
                                            <TableRow key={method}>
                                                <TableCell>{method}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(total)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>

                                </Table>
                            ) : (
                                <p>Aucun paiement trouvé.</p>
                            )}
                        </CardContent>
                    </Card>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>Fermer</Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CaisseListPage;
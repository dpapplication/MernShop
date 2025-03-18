import React, { useState, useEffect, useCallback } from 'react';
import {
    Card, CardContent, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import {
    Dialog, DialogTrigger, DialogContent, DialogClose, DialogTitle, DialogFooter, DialogHeader
} from "@/components/ui/dialog";
import axiosInstance from '@/utils/axiosInstance';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Checkbox } from "@/components/ui/checkbox";
import Header from '@/components/layout/Header';

interface Caisse {
    _id: string;
    soldeinitiale: number;
    soldefinale: number;
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

const CaisseListPage: React.FC = () => {
    const { toast } = useToast();
    const [caisses, setCaisses] = useState<Caisse[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedCaisseId, setSelectedCaisseId] = useState<string | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const navigate = useNavigate();

    // Charger les caisses
    const fetchCaisses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get<Caisse[]>('/api/caisse/');
            setCaisses(response.data);
        } catch (error) {
            console.error("Error fetching caisses:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les caisses.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    }, [toast]);

    // Charger les transactions d'une caisse spécifique
    const fetchTransactions = useCallback(async (caisseId: string) => {
        try {
            const response = await axiosInstance.get<Transaction[]>(`/api/transaction/caisse/${caisseId}`);
            setTransactions(response.data);
            console.log(response.data)
        } catch (error) {
            console.error("Error fetching transactions:", error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les transactions.",
                variant: "destructive",
            });
        }
    }, [toast]);

    // Ouvrir le dialogue et charger les transactions
    const handleShowTransactions = async (caisseId: string) => {
        setSelectedCaisseId(caisseId);
        await fetchTransactions(caisseId);
        console.log(caisseId)
        setIsDialogOpen(true);
    };

    // Fermer le dialogue
    const handleCloseModal = () => {
        setIsDialogOpen(false);
        setSelectedCaisseId(null);
        setTransactions([]);
    };

    useEffect(() => {
        fetchCaisses();
    }, [fetchCaisses]);

    // Filtrer les caisses
    const filteredCaisses = caisses.filter(caisse =>
        caisse.soldeinitiale.toString().includes(searchTerm) ||
        caisse.soldefinale.toString().includes(searchTerm) ||
        format(new Date(caisse.dateOuverture), "dd/MM/yyyy HH:mm", { locale: fr }).includes(searchTerm)
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
                        <div className="flex justify-center items-center h-20">
                            <p>Chargement des caisses...</p>
                        </div>
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
                                                <TableCell className="text-right">{caisse.soldeinitiale.toFixed(2)} €</TableCell>
                                                <TableCell className="text-right">{caisse.soldefinale.toFixed(2)} €</TableCell>
                                                <TableCell>
                                                    {format(new Date(caisse.dateOuverture), "dd/MM/yyyy HH:mm", { locale: fr })}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Checkbox checked={caisse.isOpen} disabled />
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="icon"
                                                        title="Voir les détails"
                                                        onClick={() => handleShowTransactions(caisse._id)}
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-24 text-center">
                                                Aucune caisse trouvée.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogue pour afficher les transactions */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Transactions de la Caisse</DialogTitle>
                    </DialogHeader>
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
                                                ? `+${transaction.montant.toFixed(2)} €`
                                                : `-${transaction.montant.toFixed(2)} €`}
                                        </TableCell>
                                        <TableCell>{transaction.type}</TableCell>
                                        <TableCell>{transaction.motif}</TableCell>
                                        <TableCell>
                                            {format(new Date(transaction.date), "dd/MM/yyyy HH:mm", { locale: fr })}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="mt-4">Aucune transaction pour cette caisse.</p>
                    )}
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button type="button" variant="secondary" onClick={handleCloseModal}>
                                Fermer
                            </Button>
                        </DialogClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default CaisseListPage;
import { useCallback, useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter, // Import CardFooter
} from '@/components/ui/card';
import {
  Trash2,
  DoorOpen,
  MinusIcon,
  Plus,
  CheckCircle,
  XCircle,
  Pencil,
  DoorClosed,
} from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@mui/x-date-pickers";
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import 'dayjs/locale/fr';
import dayjs from 'dayjs';
import axios from 'axios';
import axiosInstance from '@/utils/axiosInstance';




interface Transaction {
  id: string;
  type: 'depot' | 'retrait';
  montant: number;
  motif: string;
  date: Date;
}


export default function ClientForm() {
      
  const { toast } = useToast();
  const [formData, setFormData] =useState([])
  const [caisse, setCaisse] =useState({})
  const fetchClients = useCallback(async () => {
    try {
        const response = await axiosInstance.get("api/transaction");
        setFormData(response.data);
    } catch (error) {
        console.error("Erreur lors de la récupération des clients :", error);
    }
}, []);
const fetchCaisse = useCallback(async () => {
  try {
      const response = await axiosInstance.get("api/caisse/open");
      setCaisse(response.data);
      
  } catch (error) {
      console.error("Erreur lors de la récupération des clients :", error);
  }
}, []);
    useEffect(() => {
        
        fetchClients()
        fetchCaisse()
    }, [formData]);

  const [transactionFormData, setTransactionFormData] = useState<Partial<Transaction>>({
    type: 'depot',
    montant: undefined,
    motif: '',
    date: new Date(),
  });
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  const [locale, setLocale] = useState('fr');


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = (name === 'soldeInitial' || name === 'soldeFinale') ? parseFloat(value) : value;
    setFormData(prev => ({ ...prev, [name]: parsedValue }));
  };

  const handleTransactionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const parsedValue = (name === 'montant') ? parseFloat(value) : value;
    setTransactionFormData(prev => ({ ...prev, [name]: parsedValue }));
  };


  const handleDateChange = (date: Date | null) => {
    if (date) {
      setFormData(prev => ({ ...prev, dateOuverture: date }));
    }
  };

  const handleTransactionDateChange = (date: Date | null) => {
    if (date) {
      setTransactionFormData(prev => ({ ...prev, date: date }));
    }
  };


  const handleAddTransaction = async () => {
    if (!transactionFormData.type || !transactionFormData.montant || !transactionFormData.motif || !transactionFormData.date) {
      toast({
        title: "Champs de transaction requis",
        description: "Veuillez remplir tous les champs de la transaction.",
        variant: "destructive",
      });
      return;
    }

    if (editingTransactionId) {
     

      setEditingTransactionId(null);
      toast({
        title: "Transaction mise à jour",
        description: "La transaction a été mise à jour avec succès.",
        icon: <CheckCircle className="h-4 w-4 text-green-500" />,
      });
    } else {
    
      const newTransaction: Transaction = {
        id: crypto.randomUUID(),
        ...transactionFormData as Transaction,
      };


      try {
        const data =await axiosInstance.post('api/transaction',transactionFormData)
        console.log(data)
        toast({
          title: "Transaction ajoutée",
          description: "La transaction a été ajoutée avec succès.",
          icon: <CheckCircle className="h-4 w-4 text-green-500" />,
        });
      } catch (error) {
        console.log(error)
      }
     
    }

    setTransactionFormData({
      type: 'depot',
      montant: undefined,
      motif: '',
      date: new Date(),
    });
    setIsAddingTransaction(false);
  };

  const handleEditTransaction = (id: string) => {
    const transactionToEdit = formData.find(t => t._id === id);
    if (transactionToEdit) {
      setTransactionFormData(transactionToEdit);
      setIsAddingTransaction(true);
      setEditingTransactionId(id);
    }
  };


  const handleOpenCaisse = (e: React.FormEvent) => {
    e.preventDefault();

      if (formData.soldeInitial === undefined || !formData.dateOuverture) {
          toast({
            title: "Champs requis",
            description: "Veuillez remplir le solde initial et la date d'ouverture.",
            variant: "destructive",
          });
          return;
        }

        // Open the caisse and set initial state.
        setIsCaisseOpen(true);
        setFormData(prev => ({
            ...prev,
            soldeFinale: prev.soldeInitial, // Initialize soldeFinale with soldeInitial
        }));

        toast({
          title: "Caisse ouverte",
          description: "La caisse a été ouverte avec succès.",
        });
  };


  const handleRemoveTransaction =async (id: string) => {

try {
  await axiosInstance.delete('api/transaction/'+id)
  toast({
    title: "Transaction supprimée",
    description: "La transaction a été supprimée avec succès.",
  });
} catch (error) {
  console.log(error)
}
  

  };


  const handleCloseCaisse = () => {
    if (formData.soldeInitial !== formData.soldeFinale) {
      toast({
        title: "Solde incorrect",
        description: "Le solde initial doit être égal au solde final pour fermer la caisse.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.dateOuverture) {
      toast({
        title: "Date d'ouverture manquante",
        description: "La date d'ouverture doit être définie pour fermer la caisse.",
        variant: "destructive",
      });
      return;
    }

    setTransactionFormData({
      type: 'depot',
      montant: undefined,
      motif: '',
      date: new Date(),
    });
    setIsAddingTransaction(false)
    setEditingTransactionId(null);

    toast({
      title: "Caisse fermée",
      description: "La caisse a été fermée avec succès.",
    });
  };



  return (
    <Card className="w-full glass-panel animate-fade-in">
      <CardHeader className="pb-3 space-y-2">
        <CardTitle className="text-xl">Etat de Caisse</CardTitle>
      </CardHeader>
      <CardContent>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={locale}>

            
            <>
              <Card className="mb-4">
                <CardHeader>
                <div className="space-y-2 mt-4">
                        <Label htmlFor="soldeFinale">Solde Finale (Calculé)</Label>
                        
                        <Input
                          id="soldeFinale"
                          name="soldeFinale"
                          type="text"
                          placeholder="Solde final"
                          value={caisse.soldeinitiale === undefined ? '' : caisse.soldeinitiale.toFixed(2)}
                          readOnly
                          className="bg-gray-100 text-gray-700"
                        />
                      </div>
                   <Button
                      type="button"
                      onClick={() => setIsAddingTransaction(true)}
                      className="w-full mt-2 group transition-all"
                    >
                                            
                      <Plus className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
                      Ajouter Transaction
                    </Button>
                    
                </CardHeader>
                <CardContent>
                  {/* Transaction form */}
                  {isAddingTransaction && (
                    <Card className="mt-4 p-4 bg-gray-50">
                      <CardTitle className='text-lg'>{editingTransactionId ? "Modifier la Transaction" : "Ajouter une Transaction"}</CardTitle>
                      <div className="space-y-2 mt-2">
                        <Label htmlFor="transactionType">Type</Label>
                        <Select
                          value={transactionFormData.type}
                          onValueChange={(value) => setTransactionFormData(prev => ({ ...prev, type: value as 'depot' | 'retrait' }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="depot">
                              <Plus className="h-4 w-4 mr-2" /> Dépôt
                            </SelectItem>
                            <SelectItem value="retrait">
                              <MinusIcon className="h-4 w-4 mr-2" /> Retrait
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="montant">Montant</Label>
                        <Input
                          id="montant"
                          name="montant"
                          type="number"
                          placeholder="Montant de la transaction"
                          value={transactionFormData.montant === undefined ? '' : transactionFormData.montant}
                          onChange={handleTransactionChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transactionMotif">Motif</Label>
                        <Input
                          id="transactionMotif"
                          name="motif"
                          placeholder="Motif de la transaction"
                          value={transactionFormData.motif || ''}
                          onChange={handleTransactionChange}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="transactionDate">Date</Label>
                        <DatePicker
                          value={transactionFormData.date === undefined ? null : dayjs(transactionFormData.date)}
                          onChange={handleTransactionDateChange}
                          slotProps={{
                            textField: {
                              placeholder: "Sélectionner une date",
                              fullWidth: true
                            }
                          }}
                        />
                      </div>

                      <div className="flex justify-end gap-2 mt-4">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => {
                            setIsAddingTransaction(false);
                            setEditingTransactionId(null);
                            setTransactionFormData({
                              type: 'depot',
                              montant: undefined,
                              motif: '',
                              date: new Date(),
                            });
                          }}
                        >
                          Annuler
                        </Button>
                        <Button
                          type="button"
                          onClick={handleAddTransaction}
                        >
                          {editingTransactionId ? "Mettre à jour" : "Ajouter"}
                        </Button>
                      </div>
                    </Card>
                  )}

                  {/* Display Transactions */}
                  
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold">Transactions</h3>
                      <div className="border rounded-md p-4">
                        {formData.map((transaction) => (
                          <div key={transaction._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                            <div>
                              <p className="font-medium">{transaction.type === 'depot' ? 'Dépôt' : 'Retrait'}</p>
                              <p className="text-sm text-gray-500">{transaction.motif} </p>
                            </div>
                            <div className='flex items-center'>
                              <span className={`font-bold ${transaction.type === 'depot' ? 'text-green-500' : 'text-red-500'}`}>
                                {transaction.type === 'depot' ? '+' : '-'} {transaction.montant.toFixed(2)}
                              </span>
                              
                                
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTransaction(transaction._id)}
                                className="ml-2"
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="soldeFinale">Solde Finale (Calculé)</Label>
                        <Input
                          id="soldeFinale"
                          name="soldeFinale"
                          type="text"
                          placeholder="Solde final"
                          value={caisse.soldefinale === undefined ? '' : caisse.soldefinale.toFixed(2)}
                          readOnly
                          className="bg-gray-100 text-gray-700"
                        />
                      </div>
                    </div>
                  
                </CardContent>

              </Card>
            </>
         
        </LocalizationProvider>
      </CardContent>
    </Card>
  );
}
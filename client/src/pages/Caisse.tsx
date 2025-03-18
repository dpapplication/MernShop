import axios from 'axios'
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CaisseForm from '@/components/Caisses/CaisseForm';
import ClientTable from '@/components/clients/ClientTable';
import ProductForm from '@/components/products/ProductForm';
import ProductTable from '@/components/products/ProductTable';
import OrderForm from '@/components/orders/OrderForm';
import OrderSummary from '@/components/orders/OrderSummary';
import StepperControl from '@/components/common/StepperControl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { 
  Download, 
  FileText, 
  CreditCard, 
  Banknote, 
  Wallet,
  Trash2
} from 'lucide-react';
import PaymentSummary from '@/components/payment/PaymentSummary';
import axiosInstance from '@/utils/axiosInstance';


const Caisse = () => {
  const [payments, setPayments] = useState([])

    const [loading, setLoading] = useState(false); // Add loading state
  
    // --- Data Loading (using useCallback and apiService) ---
  
    const loadClients = useCallback(async () => {
      setLoading(true); 
      try {
        const response = await axiosInstance.get('api/paiements/')
        setPayments(response.data);
      } catch (error) {
       
      } finally {
        setLoading(false); // Set loading to false after fetching (success or failure)
      }
    }, []);

    useEffect(() => {
      loadClients();
    }, []);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      
      <main className="flex-1 container py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
    <CaisseForm  />
   <PaymentSummary
  payments={payments}
   />
     
  </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Caisse;

import axios from 'axios';
import { useState, useEffect, useCallback } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ClientForm from '@/components/clients/ClientForm';
import ClientTable from '@/components/clients/ClientTable';
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/utils/axiosInstance';
interface Client {
  _id: string;
  nom: string;
  adresse: string;
  telephone: string;
}

const apiService = {
  getClients: async (): Promise<Client[]> => {
    const response = await axiosInstance.get<Client[]>('api/clients/');
    return response.data;
  },
  addClient: async (client: Client): Promise<Client> => {
    const response = await axiosInstance.post<Client>('api/clients/', client);
    return response.data;
  },
  deleteClient: async (id: string): Promise<void> => {
    const response =await axiosInstance.delete(`api/clients/${id}`);
    return response.data;
  },
  updateClient: async (client: Client): Promise<Client> => {
      const response = await axiosInstance.put<Client>(`api/clients/${client._id}`, client);
      return response.data;
  }
};



const Index = () => {
  const { toast } = useToast();

  // --- State ---
  const [currentStep, setCurrentStep] = useState(0);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false); // Add loading state

  // --- Data Loading (using useCallback and apiService) ---

  const loadClients = useCallback(async () => {
    setLoading(true); 
    try {
      const clientsData = await apiService.getClients();
      setClients(clientsData);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false); // Set loading to false after fetching (success or failure)
    }
  }, []);


  // Initial Load (useEffect)
  useEffect(() => {
    loadClients();
  }, []);

    const handleApiError = (error: unknown) => {
      if (axios.isAxiosError(error)) {
        // This is an Axios-specific error (network, timeout, etc.)
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Server Error:", error.response.status, error.response.data);
          toast({
            title: "Server Error",
            description: `Status: ${error.response.status}.  ${error.response.data?.message || 'An error occurred.'}`,
            variant: "destructive",
          });

        } else if (error.request) {
          // The request was made but no response was received
          console.error("Network Error:", error.request);
          toast({
            title: "Network Error",
            description: "No response received from the server.  Check your network connection.",
            variant: "destructive",
          });
        } else {
          // Something happened in setting up the request that triggered an Error
          console.error("Request Error:", error.message);
          toast({
            title: "Request Error",
            description: error.message,
            variant: "destructive",
          });
        }
      } else {
        // This is a generic error (not Axios related)
        console.error("An unexpected error occurred:", error);
        toast({
          title: "Unexpected Error",
          description: "An unexpected error occurred.  Please try again later.",
          variant: "destructive",
        });
      }
  };


  // --- Client Handlers ---

  const handleAddClient = async (client: Client) => {
    try {
      const newClient = await apiService.addClient(client);
      setClients([...clients, newClient]);  // Update immediately
      toast({ title: "Client Added", description: `Client ${newClient.nom} added successfully.` });
    } catch (error) {
      handleApiError(error); // Use centralized error handler
    }
  };

  const handleDeleteClient = async (id: string) => {
    try {
      await apiService.deleteClient(id);
      setClients(clients.filter((c) => c._id !== id)); // Update immediately
      toast({ title: "Client Deleted", description: "Client deleted successfully." });
    } catch (error) {
       handleApiError(error);
    }
  };
   const handleEditClient = async (updatedClient: Client) => {
        try {
            const client = await apiService.updateClient(updatedClient);
            setClients(clients.map(c => c._id === updatedClient._id ? client : c));
            toast({ title: "Client modifié", description: `Le client ${updatedClient.nom} a été modifié.` });

        } catch (error) {
            handleApiError(error);
        }
    };

  const handleAddClientToOrder = (client: Client) => {
    setSelectedClient(client);
    toast({
      title: "Client Selected",
      description: `${client.nom} has been added to the order.`,
    });
    if (currentStep === 0) {
      setCurrentStep(1);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />

      <main className="flex-1 container py-8">
      {loading && <div>Loading...</div>} {/* Show loading indicator */}
        {!loading && ( // Only render content when not loading
          <>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {/* IMPORTANT: Pass necessary props *down* to child components */}
          <ClientForm onClientAdded={handleAddClient}  onClientUpdated={handleEditClient} selectedClient={selectedClient}/>
          <ClientTable
            clients={clients}
            onDeleteClient={handleDeleteClient}
            onEditClient={handleEditClient}
            onAddToOrder={handleAddClientToOrder}
          />
        </div>
        </>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
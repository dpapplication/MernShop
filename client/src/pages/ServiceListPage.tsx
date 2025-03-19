// src/components/ServiceListPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { PlusCircle, Pencil, Trash2, Search } from 'lucide-react'; // Icons
import { useToast } from '@/components/ui/use-toast';
import axiosInstance from '@/utils/axiosInstance';
import {
    Dialog, DialogTrigger, DialogContent, DialogClose,
    DialogTitle, DialogDescription, DialogFooter, DialogHeader
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label" //For form
import Header from '@/components/layout/Header';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale'


interface Service {
  _id: string;
  nom: string;
  prix: number;
}

const ServiceListPage: React.FC = () => {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAddMode, setIsAddMode] = useState(true); // true for add, false for edit
  const [currentService, setCurrentService] = useState<Service>({ _id: '', nom: '', prix: 0 });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get<Service[]>('/api/services');
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast({
        title: "Error",
        description: "Failed to fetch services.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const filteredServices = services.filter(service =>
    service.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.prix.toString().includes(searchTerm)
  );

//Format Currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
   };

  // --- Dialog Handlers ---
 const handleOpenDialog = (service?: Service) => { // Optional service for editing
    if (service) {
        setIsAddMode(false); // Edit mode
        setCurrentService(service);
    } else {
        setIsAddMode(true); // Add mode
        setCurrentService({ _id: '', nom: '', prix: 0 }); // Reset form
    }
     setIsDialogOpen(true);
};

const handleCloseDialog = () => {
    setIsDialogOpen(false);
     // No need to reset currentService here; it's handled in handleOpenDialog
};
// --- Input Change ---
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
     if (name === 'prix') {
        const numValue = parseFloat(value);
         if (isNaN(numValue)) {
            toast({ title: "Error", description: "Please enter a valid number for the price.", variant: 'destructive' })
                return; // Prevent updating
         }
          setCurrentService(prev => ({ ...prev, [name]: numValue }));
        }else {
            setCurrentService(prev => ({ ...prev, [name]: value }));
        }

  };

  // --- CRUD Operations ---

  const handleAddService = async () => {
     if (!currentService.nom || isNaN(currentService.prix) || currentService.prix <= 0) {
        toast({ title: "Error", description: "Please fill all fields correctly.", variant: "destructive" });
        return;
      }
    try {
      const response = await axiosInstance.post<Service>('/api/services', currentService);
      setServices(prevServices => [...prevServices, response.data]);
      toast({ title: "Success", description: "Service added successfully." });
      handleCloseDialog();
    } catch (error) {
      console.error("Error adding service:", error);
      toast({ title: "Error", description: "Failed to add service.", variant: "destructive" });
    }
  };

  const handleUpdateService = async () => {
       if (!currentService.nom || isNaN(currentService.prix) || currentService.prix <= 0) {
        toast({ title: "Error", description: "Please fill all fields correctly.", variant: "destructive" });
        return;
       }
    try {
      const response = await axiosInstance.put<Service>(`/api/services/${currentService._id}`, currentService);
      setServices(prevServices =>
        prevServices.map(s => (s._id === currentService._id ? response.data : s))
      );
      toast({ title: "Success", description: "Service updated successfully." });
      handleCloseDialog();
    } catch (error) {
      console.error("Error updating service:", error);
      toast({ title: "Error", description: "Failed to update service.", variant: "destructive" });
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await axiosInstance.delete(`/api/services/${id}`);
      setServices(prevServices => prevServices.filter(s => s._id !== id));
      toast({ title: "Success", description: "Service deleted successfully." });
    } catch (error) {
      console.error("Error deleting service:", error);
      toast({ title: "Error", description: "Failed to delete service.", variant: "destructive" });
    }
  };


  return (
    <>
        <Header/>
      <Card className="w-full">
        <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <CardTitle className="text-xl">Services List</CardTitle>
                {/* Search Input */}
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name or price..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-full sm:w-[250px] focus:w-full sm:focus:w-[300px] transition-all duration-300"
                    />
                </div>
            </div>
          </CardHeader>

        <CardContent>
          <Button onClick={() => handleOpenDialog()} className="mb-4">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Service
          </Button>
          {loading ? (
            <div className="flex justify-center items-center h-20">
              <p>Loading services...</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServices.length > 0 ? (
                    filteredServices.map((service) => (
                      <TableRow key={service._id}>
                        <TableCell>{service._id}</TableCell>
                        <TableCell>{service.nom}</TableCell>
                        <TableCell className="text-right">{formatCurrency(service.prix)}</TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            title="Edit"
                            onClick={() => handleOpenDialog(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            title="Delete"
                            onClick={() => handleDeleteService(service._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center">
                        No services found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{isAddMode ? "Add Service" : "Edit Service"}</DialogTitle>
                 <DialogDescription>
              {isAddMode
                ? "Add a new service here. Click save when you're done."
                : "Make changes to your service here. Click save when you're done."}
            </DialogDescription>
            </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nom" className="text-right"> Name </Label>
                <Input
                  id="nom"
                  name="nom"
                  value={currentService.nom}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
             </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="prix" className="text-right">  Price  </Label>
                  <Input
                    type="number"
                    id="prix"
                    name="prix"
                    value={currentService.prix === 0 ? '' : currentService.prix}
                    onChange={handleInputChange}
                    className="col-span-3"
                    placeholder="0.00"
                  />
             </div>
          </div>
                <DialogFooter>
                   <DialogClose asChild>
                        <Button type="button" variant="secondary" onClick={handleCloseDialog}>
                            Cancel
                        </Button>
                    </DialogClose>
                    <Button  onClick={isAddMode ? handleAddService : handleUpdateService}>
                        {isAddMode ? "Add" : "Update"}
                    </Button>
                </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ServiceListPage;
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Users,
  ShoppingCart,
  FileText,
  Home,
  Menu,
    Bell,
  LogOut,
  Settings
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
//import Badge  from "@/components/ui/badge"
 import { Badge } from "@/components/ui/badge"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
  } from "@/components/ui/popover" // Import Popover

  import axios from 'axios';
import { useAuth } from '../auth/authContext';

  // Define a type for the low stock product
interface ProductLowStock {
  _id: string;
  nom: string;
  stock: number;
}[];

export default function Header() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
   const [lowStockProducts, setLowStockProducts] = useState<ProductLowStock[]>([]); // Array of products
  const API_BASE_URL = "http://localhost:3000/api";

   const fetchLowStockProducts = useCallback(async () => {
    try {
      const response = await axios.get<ProductLowStock[]>(`${API_BASE_URL}/produits/`);
      setLowStockProducts(response.data);
    } catch (error) {
        console.error("Error fetching low stock products:", error);
       
    }
  }, [API_BASE_URL]); 

  useEffect(() => {
    fetchLowStockProducts();
        const intervalId = setInterval(fetchLowStockProducts, 60000);

        return () => clearInterval(intervalId); 
  }, [fetchLowStockProducts]);
  const { logout } = useAuth();

  const handleLogout = () => {
    logout(); 
  };

  const navItems = [
    { name: 'Accueil', path: '/dashbord', icon: <Home className="h-5 w-5" /> },
    { name: 'Clients', path: '/clients', icon: <Users className="h-5 w-5" /> },
    { name: 'Produits', path: '/produits', icon: <ShoppingCart className="h-5 w-5" /> },
    { name: 'Commande', path: '/Commande', icon: <ShoppingCart className="h-5 w-5" /> },
    { name: 'caisse', path: '/caisse', icon: <ShoppingCart className="h-5 w-5" /> },
    { name: 'Statistiques', path: '/Statistique', icon: <FileText className="h-5 w-4" /> },
  ];


  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-sm border-b bg-background/60 transition-all">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Menu"
            className="md:hidden"
            onClick={() => setIsOpen(true)}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Menu</span>
          </Button>
          <span className="text-xl font-medium animate-float">
            Yassine Amabraa
          </span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
                <Button
                    key={item.path}
                    variant="ghost"
                    size="sm"
                    className={cn(
                    "flex items-center gap-1 text-base transition-all",
                    location.pathname === item.path
                        ? "text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                onClick={() => navigate(item.path)} >
                {item.icon}
              <span>{item.name}</span>
            </Button>
          ))}
        </nav>

        {/* User Actions */}
        <div className="flex items-center gap-2">
            {/* Notification Bell with Popover */}
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Notifications"  className="relative">
                        <Bell className="h-5 w-5" />
                        {lowStockProducts.length > 0 && (
                            <Badge variant="secondary" className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2  rounded-full text-xs">
                            {lowStockProducts.length}
                          </Badge>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
                    {lowStockProducts.length > 0 ? (
                    <div className='p-2 max-h-60 overflow-auto'>
                        <p className="text-sm font-semibold">Low Stock Products:</p>
                           <ul  className="mt-2 space-y-1 " >
                            {lowStockProducts.map(product => (
                                <li key={product._id} className="text-sm" >
                                {product.nom} (Stock: {product.stock})
                                </li>
                            ))}
                        </ul>
                        </div>
                    ) : (
                        <div className="p-4">No low stock products.</div>
                    )}
                </PopoverContent>
            </Popover>

          <Button
            variant="ghost"
            size="icon"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Logout"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="left" className="w-[240px] sm:w-[300px]">
          <SheetHeader>
            <SheetTitle className="text-left">Menu</SheetTitle>
          </SheetHeader>
            <nav className="flex flex-col gap-2 mt-4">
            {navItems.map(item => (
              <Button
                key={item.path}
                variant="ghost"
                className={cn("justify-start gap-2",location.pathname === item.path ? "bg-accent text-accent-foreground" : "hover:bg-accent hover:text-accent-foreground")}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false); // Close the sheet after navigation
                }}
              >
                {item.icon}
                {item.name}
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </header>
  );
};
import Index from "./pages/Index";
import Produit from "./pages/Produit";
import Client from "./pages/Client";
import Caisse from "./pages/Caisse";
import Commande from "./pages/Commande";
import Statistique from "./pages/Statistique";
import OrderEditPage from "./pages/OrderEditPage";
import LoginPage from "./pages/Login";
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/authContext';
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CaisseList from "./pages/CaisseList";


function App() {
  return (
    <Router>
      <AuthProvider> {/* Wrap your entire app with AuthProvider */}
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Routes using Outlet */}
          <Route path="/" element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Index />} />
              {/* Add more protected routes here */}
               <Route index element={<Navigate to="/dashboard" replace />} />
               <Route path="/dashbord" element={<Index />} />
          <Route path="/clients" element={<Client />} />
          <Route path="/produits" element={<Produit />} />
          <Route path="/Commande" element={<Commande />} />
          <Route path="/caisse" element={<Caisse />} />
          <Route path="/historique" element={<CaisseList />} />
          
          <Route path="/orders/edit/:orderId" element={<OrderEditPage />} />
          </Route>

           {/* Catch-all route for unmatched paths */}
            <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
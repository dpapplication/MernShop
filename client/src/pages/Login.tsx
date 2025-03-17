import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Lock, User, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/authContext';
import axiosInstance from '@/utils/axiosInstance';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setToken } = useAuth(); // Get setToken from useAuth


  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setEmailError('');
    setPasswordError('');

    let hasError = false;

    // Validate email
    if (!email) {
      setEmailError("L'adresse email est requise.");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Veuillez entrer une adresse email valide.");
      hasError = true;
    }

    // Validate password
    if (!password) {
      setPasswordError("Le mot de passe est requis.");
      hasError = true;
    }

    if (hasError) {
      return; 
    }

    setIsLoading(true);

    try {
      const response = await axiosInstance.post('/api/user/login', { email, password });

      if (response.data.token) {
        setToken(response.data.token); 
        toast({ 
          title: "Connexion réussie",
          description: "Vous êtes maintenant connecté.",
        });
        navigate('/dashboard');
      } else {
        toast({
          title: "Erreur de connexion",
          description: "Une erreur inconnue s'est produite.",
          variant: "destructive",
        });
        throw new Error('Token missing in the server response.');
      }
    } catch (error: any) {
      toast({
        title: 'Login Error',
        description: error.message || 'An unknown error occurred.',
        variant: 'destructive',
      });
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl">Le mobile</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">
                <User className='h-4 w-4 mr-2' />Nom d'utilisateur
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Entrez votre nom d'utilisateur"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {emailError && <p className="text-red-500 text-sm">{emailError}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">
                <KeyRound className='h-4 w-4 mr-2' />Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Entrez votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {passwordError && <p className="text-red-500 text-sm">{passwordError}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Lock className="mr-2 h-4 w-4 animate-spin" /> Connexion en cours...
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4 " /> Se connecter
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className='flex justify-center'>
          <a href="/forgot-password" className="text-sm text-blue-500 hover:underline">
            Mot de passe oublié ?
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}

export default LoginPage;
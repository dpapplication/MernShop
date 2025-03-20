import React, { useState, FormEvent } from 'react';
import {
  Card, CardContent, CardHeader, CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useToast } from "@/components/ui/use-toast";
import { Lock, User, KeyRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/authContext';
import axiosInstance from '@/utils/axiosInstance';
import axios from 'axios';


function LoginPage() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setEmailError('');
    setPasswordError('');

    let hasError = false;

    if (!email) {
      setEmailError("L'adresse email est requise.");
      hasError = true;
    } else if (!validateEmail(email)) {
      setEmailError("Veuillez entrer une adresse email valide.");
      hasError = true;
    }

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
        throw new Error('Token missing in the server response.'); //Should be handled by axios interceptor
      }
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          console.error('Server responded with:', error.response.status, error.response.data);

          if (error.response.status === 401) {
            toast({
              title: 'Erreur de connexion',
              description: 'Email ou mot de passe incorrect.',
              variant: 'destructive',
            });
          } else if (error.response.status === 400) {
            const serverErrors = error.response.data.errors;
            if (serverErrors) {
              if (serverErrors.email) setEmailError(serverErrors.email);
              if (serverErrors.password) setPasswordError(serverErrors.password);
            } else {
              toast({
                title: 'Erreur de requête',
                description: 'Veuillez vérifier les informations saisies.',
                variant: 'destructive',
              });
            }
          } else {
            toast({
              title: 'Erreur Serveur',
              description: 'Une erreur s\'est produite sur le serveur.',
              variant: 'destructive',
            });
          }
        } else if (error.request) {
          console.error('No response received:', error.request);
          toast({
            title: 'Erreur Réseau',
            description: 'Aucune réponse du serveur.  Vérifiez votre connexion.',
            variant: 'destructive',
          });

        } else {
          console.error('Error setting up request:', error.message);
          toast({
            title: 'Erreur',
            description: error.message || 'Une erreur inconnue s\'est produite.',
            variant: 'destructive',
          });
        }
      } else {
        console.error('Non-Axios error:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur inconnue s\'est produite.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="flex flex-col items-center w-full max-w-md">
                <img
                    src='./logo.jpeg'
                    alt="Your Company Logo"
                    className="mb-4 w-20 h-auto rounded-full"
                    style={{ animation: 'pulse 2s ease-in-out infinite' }} // Changed animation here
                />
                <Card className="w-full">
                    <CardHeader className="text-center space-y-2">
                        {/* No CardTitle needed here, the logo is above */}
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
                                    aria-label="Email Address"
                                    aria-describedby="email-error"
                                />
                                {emailError && <p id="email-error" className="text-red-500 text-sm">{emailError}</p>}
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
                                    aria-label="Password"
                                    aria-describedby="password-error"
                                />
                                {passwordError && <p id="password-error" className="text-red-500 text-sm">{passwordError}</p>}
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
            {/* Keyframes for the animation */}
            <style>{`
        @keyframes pulse {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
        </div>
    );
}

export default LoginPage;
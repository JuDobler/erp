import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "./queryClient";
import { useToast } from "@/hooks/use-toast";
import { LoginData } from "@shared/schema";
import { useLocation } from "wouter";

type User = {
  id: number;
  username: string;
  name: string;
  role: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (data: LoginData) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
  isLawyer: () => boolean;
  isFinancial: () => boolean;
  isSecretary: () => boolean;
  isIntern: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const { isLoading, data } = useQuery<User>({
    queryKey: ['/api/auth/me'],
    retry: false,
    gcTime: 0
  });

  useEffect(() => {
    if (data) {
      setUser(data);
    }
  }, [data]);

  const loginMutation = useMutation({
    mutationFn: async (loginData: LoginData) => {
      const response = await apiRequest('POST', '/api/auth/login', loginData);
      return response.json();
    },
    onSuccess: (userData) => {
      setUser(userData);
      setLocation('/dashboard');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      toast({
        title: "Login realizado com sucesso",
        description: `Bem-vindo, ${userData.name}!`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      setLocation('/login');
      queryClient.clear();
      toast({
        title: "Logout realizado com sucesso",
        description: "Você foi desconectado do sistema.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao fazer logout",
        description: error.message || "Ocorreu um erro ao tentar desconectar.",
        variant: "destructive",
      });
    },
  });

  const login = async (loginData: LoginData) => {
    await loginMutation.mutateAsync(loginData);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const isAdmin = () => user?.role === 'admin';
  const isLawyer = () => user?.role === 'advogado';
  const isFinancial = () => user?.role === 'financeiro';
  const isSecretary = () => user?.role === 'secretaria';
  const isIntern = () => user?.role === 'estagiario';

  return (
    <AuthContext.Provider 
      value={{
        user,
        isLoading,
        login,
        logout,
        isAdmin,
        isLawyer,
        isFinancial,
        isSecretary,
        isIntern
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuthContext } from "@/lib/auth";
import { loginSchema } from "@shared/schema";
import logo from "@/assets/logo.png";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const { login } = useAuthContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Define form with zod resolver
  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle form submission
  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
      await login(values);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: "Verifique suas credenciais e tente novamente.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-primary-600 to-primary-900 flex items-center justify-center z-50">
      <div className="w-full max-w-md px-4">
        <Card className="w-full">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="h-24 w-auto">
                <img src={logo} alt="Dobler Advogados" className="h-full object-contain" />
              </div>
            </div>
            <CardDescription className="text-lg">
              Sistema de Gestão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usuário</FormLabel>
                      <FormControl>
                        <Input placeholder="Digite seu usuário" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Digite sua senha" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="justify-center text-sm text-gray-500">
            <div className="text-center">
              <p>© {new Date().getFullYear()} Dobler Advogados</p>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

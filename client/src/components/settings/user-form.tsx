import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, User, userRoleEnum } from "@shared/schema";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { userRoleLabels } from "@shared/schema";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type UserFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: User | null;
};

export function UserForm({ open, onOpenChange, user }: UserFormProps) {
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  
  const isEditing = !!user;
  
  // Estenda o schema para validação adicional e campos obrigatórios diferentes para edição vs criação
  const formSchema = isEditing
    ? insertUserSchema.extend({
        password: z.string().optional().or(z.literal('')),
      })
    : insertUserSchema.extend({
        password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
      });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: user
      ? {
          ...user,
          password: "",
        }
      : {
          name: "",
          username: "",
          email: "",
          role: "advogado",
          password: "",
        },
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const response = await apiRequest(
        "POST",
        "/api/users",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message || "Ocorreu um erro ao criar o usuário.",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: number; userData: any }) => {
      const { id, userData } = data;
      // Se a senha estiver vazia, remova-a dos dados enviados
      if (!userData.password) {
        delete userData.password;
      }
      const response = await apiRequest(
        "PATCH",
        `/api/users/${id}`,
        userData
      );
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message || "Ocorreu um erro ao atualizar o usuário.",
        variant: "destructive",
      });
    },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (isEditing && user) {
      await updateUserMutation.mutate({
        id: user.id,
        userData: data,
      });
    } else {
      await createUserMutation.mutate(data);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Edite as informações do usuário abaixo."
              : "Preencha as informações do novo usuário."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Usuário</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome de usuário" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="email@exemplo.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma função" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.keys(userRoleLabels).map((role) => (
                          <SelectItem key={role} value={role}>
                            {userRoleLabels[role as keyof typeof userRoleLabels]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isEditing ? "Nova Senha (opcional)" : "Senha"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder={
                          isEditing ? "Deixe em branco para manter" : "********"
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="mt-6">
              <Button
                type="submit"
                className="bg-primary-600 hover:bg-primary-700"
                disabled={
                  createUserMutation.isPending || updateUserMutation.isPending
                }
              >
                {createUserMutation.isPending || updateUserMutation.isPending
                  ? "Salvando..."
                  : isEditing
                  ? "Salvar Alterações"
                  : "Criar Usuário"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
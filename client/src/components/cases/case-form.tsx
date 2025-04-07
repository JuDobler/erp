import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertCaseSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { LEGAL_AREAS } from "@/lib/constants";
import { useAuthContext } from "@/lib/auth";
import { ClientSearch } from "@/components/common/client-search";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type CaseFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CaseForm({ open, onOpenChange }: CaseFormProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();

  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    enabled: open,
  });

  const form = useForm<z.infer<typeof insertCaseSchema>>({
    resolver: zodResolver(insertCaseSchema),
    defaultValues: {
      title: "",
      description: "",
      legalArea: "direito_civil",
      status: "ativo",
      value: undefined,
      assignedToId: user?.id,
    },
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertCaseSchema>) => {
      // Ensure value is sent as string to match the schema expectation
      const formattedData = {
        ...data,
        value: data.value !== undefined && data.value !== null ? data.value.toString() : null,
      };

      const response = await apiRequest("POST", "/api/cases", formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Caso criado com sucesso",
        description: "O novo caso foi adicionado ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cases"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar caso",
        description: error.message || "Ocorreu um erro ao criar o caso.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof insertCaseSchema>) {
    createCaseMutation.mutate(data);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Caso</DialogTitle>
          <DialogDescription>
            Adicione um novo caso ao sistema. Preencha os dados abaixo.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input placeholder="Título do caso" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <FormControl>
                      <ClientSearch 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Buscar cliente..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="legalArea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma área" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LEGAL_AREAS.map((area) => (
                          <SelectItem key={area.value} value={area.value}>
                            {area.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição do caso" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        onChange={(e) => {
                          // Converter para string para evitar problemas com o envio para o backend
                          // Primeiro convertemos para número para validação e depois para string
                          const numValue = e.target.value === '' ? undefined : Number(e.target.value);
                          field.onChange(numValue);
                        }}
                        value={field.value === undefined || field.value === null ? '' : field.value}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="aguardando_documentos">Aguardando Documentos</SelectItem>
                        <SelectItem value="aguardando_decisao">Aguardando Decisão</SelectItem>
                        <SelectItem value="em_recurso">Em Recurso</SelectItem>
                        <SelectItem value="arquivado">Arquivado</SelectItem>
                        <SelectItem value="ganho">Ganho</SelectItem>
                        <SelectItem value="perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={createCaseMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createCaseMutation.isPending}>
                {createCaseMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

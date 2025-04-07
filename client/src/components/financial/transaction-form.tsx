import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTransactionSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/lib/auth";
import { format } from "date-fns";

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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";

type TransactionFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction?: any; // Optional transaction for editing
};

export function TransactionForm({ open, onOpenChange, transaction }: TransactionFormProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();

  const isEditing = !!transaction;

  const { data: cases, isLoading: isCasesLoading } = useQuery({
    queryKey: ['/api/cases'],
    enabled: open,
  });

  const form = useForm<z.infer<typeof insertTransactionSchema>>({
    resolver: zodResolver(insertTransactionSchema),
    defaultValues: transaction ? {
      ...transaction,
      date: transaction.date ? new Date(transaction.date) : new Date(),
      dueDate: transaction.dueDate ? new Date(transaction.dueDate) : undefined,
    } : {
      type: "despesa",
      description: "",
      amount: undefined,
      date: new Date(),
      paid: false,
    },
  });

  const transactionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertTransactionSchema>) => {
      const url = isEditing ? `/api/transactions/${transaction.id}` : "/api/transactions";
      const method = isEditing ? "PUT" : "POST";
      
      // Format the data for the API
      const formattedData = {
        ...data,
        amount: parseFloat(data.amount.toString()),
      };
      
      const response = await apiRequest(method, url, formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Transação atualizada" : "Transação criada com sucesso",
        description: isEditing 
          ? "A transação foi atualizada com sucesso." 
          : "A nova transação foi adicionada ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Erro ao atualizar transação" : "Erro ao criar transação",
        description: error.message || "Ocorreu um erro ao processar a transação.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof insertTransactionSchema>) {
    transactionMutation.mutate(data);
  }

  const isLoading = isCasesLoading || transactionMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Transação" : "Nova Transação"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edite os detalhes da transação abaixo." 
              : "Adicione uma nova transação ao sistema. Preencha os dados abaixo."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="receita">Receita</SelectItem>
                        <SelectItem value="despesa">Despesa</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
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
                          const value = e.target.value === '' ? 0 : Number(e.target.value);
                          field.onChange(value);
                        }}
                        value={field.value === undefined ? '' : field.value}
                      />
                    </FormControl>
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
                    <Input placeholder="Descrição da transação" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className="w-full pl-3 text-left font-normal"
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data de Vencimento</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value && "text-muted-foreground"
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecione uma data (opcional)</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="caseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Caso</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(value && value !== "null" ? parseInt(value) : null)} 
                      value={field.value?.toString() || "null"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um caso (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">Nenhum</SelectItem>
                        {cases?.map((caseItem: any) => (
                          <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                            {caseItem.title}
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
                name="paid"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Transação paga/recebida
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-black hover:bg-gray-900 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

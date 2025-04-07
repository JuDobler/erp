import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TASK_PRIORITIES } from "@/lib/constants";
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
import { Textarea } from "@/components/ui/textarea";
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

type TaskFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: any; // Optional task for editing
};

export function TaskForm({ open, onOpenChange, task }: TaskFormProps) {
  const { toast } = useToast();
  const { user } = useAuthContext();
  const [clientSearch, setClientSearch] = useState("");

  const isEditing = !!task;

  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ['/api/clients'],
    enabled: open,
    onSuccess: (data) => {
      // Set client name in search field if editing a task with client
      if (isEditing && task.clientId && data) {
        const client = data.find((c: any) => c.id === task.clientId);
        if (client) {
          setClientSearch(client.name);
        }
      }
    }
  });

  const { data: cases, isLoading: isCasesLoading } = useQuery({
    queryKey: ['/api/cases'],
    enabled: open,
  });

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: open,
  });

  const form = useForm<z.infer<typeof insertTaskSchema>>({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: task ? {
      ...task,
      deadline: task.deadline ? new Date(task.deadline) : undefined,
      // Ensure IDs are set as numbers
      clientId: task.clientId ? Number(task.clientId) : undefined,
      caseId: task.caseId ? Number(task.caseId) : undefined,
      assignedToId: task.assignedToId ? Number(task.assignedToId) : user?.id,
    } : {
      title: "",
      description: "",
      priority: "media",
      completed: false,
      assignedToId: user?.id,
      clientId: undefined,
      caseId: undefined,
      createdById: user?.id,
    },
  });

  const taskMutation = useMutation({
    mutationFn: async (data: z.infer<typeof insertTaskSchema>) => {
      const url = isEditing ? `/api/tasks/${task.id}` : "/api/tasks";
      const method = isEditing ? "PUT" : "POST";
      
      // Add createdById if not editing
      const formattedData = {
        ...data,
        createdById: isEditing ? data.createdById : user?.id
      };
      
      const response = await apiRequest(method, url, formattedData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: isEditing ? "Tarefa atualizada" : "Tarefa criada com sucesso",
        description: isEditing 
          ? "A tarefa foi atualizada com sucesso." 
          : "A nova tarefa foi adicionada ao sistema.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: isEditing ? "Erro ao atualizar tarefa" : "Erro ao criar tarefa",
        description: error.message || "Ocorreu um erro ao processar a tarefa.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof insertTaskSchema>) {
    taskMutation.mutate(data);
  }

  const isLoading = isClientsLoading || isCasesLoading || isUsersLoading || taskMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Tarefa" : "Nova Tarefa"}</DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Edite os detalhes da tarefa abaixo." 
              : "Adicione uma nova tarefa ao sistema. Preencha os dados abaixo."}
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
                    <Input placeholder="Título da tarefa" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição detalhada da tarefa" 
                      className="min-h-[80px]" 
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
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridade</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a prioridade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TASK_PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            {priority.label}
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
                name="deadline"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Prazo</FormLabel>
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
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
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
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <div className="relative">
                      <Input
                        type="text"
                        placeholder="Digite para buscar um cliente"
                        value={clientSearch || ""}
                        onChange={(e) => {
                          setClientSearch(e.target.value);
                        }}
                      />
                      {clientSearch && clients && clients.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border">
                          <div className="p-2 border-b cursor-pointer hover:bg-gray-100" 
                               onClick={() => {
                                 field.onChange(null);
                                 setClientSearch("");
                               }}>
                            Nenhum
                          </div>
                          {clients
                            .filter((client: any) => 
                              client.name.toLowerCase().includes(clientSearch.toLowerCase()))
                            .map((client: any) => (
                              <div
                                key={client.id}
                                className="p-2 cursor-pointer hover:bg-gray-100"
                                onClick={() => {
                                  field.onChange(client.id);
                                  setClientSearch(client.name);
                                }}
                              >
                                {client.name}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                    {field.value && (
                      <div className="text-sm text-muted-foreground">
                        Cliente selecionado: {clients?.find((c: any) => c.id === field.value)?.name || ""}
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="assignedToId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Responsável</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um responsável" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {users?.map((user: any) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            {user.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEditing && (
                <FormField
                  control={form.control}
                  name="completed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Marcar como concluída
                      </FormLabel>
                    </FormItem>
                  )}
                />
              )}
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
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

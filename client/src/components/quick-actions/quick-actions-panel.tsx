import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { QuickAction } from "@shared/schema";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { PlusIcon, ZapIcon, CopyIcon, PencilIcon, TrashIcon } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

const quickActionSchema = z.object({
  title: z.string().min(1, { message: "Título é obrigatório" }),
  description: z.string().nullable().optional(),
  actionType: z.string().min(1, { message: "Tipo de ação é obrigatório" }),
  templateContent: z.string().nullable().optional(),
});

type QuickActionFormValues = z.infer<typeof quickActionSchema>;

export function QuickActionsPanel() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);

  const form = useForm<QuickActionFormValues>({
    resolver: zodResolver(quickActionSchema),
    defaultValues: {
      title: "",
      description: "",
      actionType: "",
      templateContent: "",
    },
  });

  // Fetch quick actions
  const { data: quickActions, isLoading, error } = useQuery({
    queryKey: ["/api/quick-actions"],
    queryFn: async () => {
      const response = await fetch("/api/quick-actions");
      if (!response.ok) {
        throw new Error("Failed to fetch quick actions");
      }
      return response.json();
    },
  });

  // Create mutation
  const createQuickAction = useMutation({
    mutationFn: async (data: QuickActionFormValues) => {
      return apiRequest("/api/quick-actions", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-actions"] });
      setIsOpen(false);
      form.reset();
      toast({
        title: "Ação rápida criada",
        description: "A ação rápida foi criada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível criar a ação rápida",
        variant: "destructive",
      });
    },
  });

  // Update mutation
  const updateQuickAction = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: QuickActionFormValues }) => {
      return apiRequest(`/api/quick-actions/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-actions"] });
      setIsOpen(false);
      setEditingAction(null);
      form.reset();
      toast({
        title: "Ação rápida atualizada",
        description: "A ação rápida foi atualizada com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ação rápida",
        variant: "destructive",
      });
    },
  });

  // Delete mutation
  const deleteQuickAction = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/quick-actions/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/quick-actions"] });
      toast({
        title: "Ação rápida excluída",
        description: "A ação rápida foi excluída com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a ação rápida",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuickActionFormValues) => {
    if (editingAction) {
      updateQuickAction.mutate({ id: editingAction.id, data });
    } else {
      createQuickAction.mutate(data);
    }
  };

  const handleEdit = (action: QuickAction) => {
    setEditingAction(action);
    form.reset({
      title: action.title,
      description: action.description || "",
      actionType: action.actionType,
      templateContent: action.templateContent || "",
    });
    setIsOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir esta ação rápida?")) {
      deleteQuickAction.mutate(id);
    }
  };

  const handleCopy = (content: string | null) => {
    if (content) {
      navigator.clipboard.writeText(content);
      toast({
        title: "Conteúdo copiado",
        description: "O texto foi copiado para a área de transferência",
      });
    }
  };

  const handleAddNew = () => {
    setEditingAction(null);
    form.reset({
      title: "",
      description: "",
      actionType: "",
      templateContent: "",
    });
    setIsOpen(true);
  };

  if (isLoading) return <div>Carregando ações rápidas...</div>;
  if (error) return <div>Erro ao carregar ações rápidas</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Ações Rápidas</h3>
        <Button onClick={handleAddNew}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Nova ação rápida
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAction ? "Editar ação rápida" : "Nova ação rápida"}</DialogTitle>
            <DialogDescription>
              Crie atalhos para textos e modelos frequentemente utilizados.
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
                      <Input placeholder="Ex: Petição Inicial" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="actionType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de ação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: contrato, petição, notificação" {...field} />
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
                        placeholder="Descreva o propósito desta ação rápida"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="templateContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conteúdo do modelo</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Insira o texto do modelo, você pode usar {cliente}, {processo}, etc como placeholders"
                        className="min-h-[200px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit" disabled={createQuickAction.isPending || updateQuickAction.isPending}>
                  {createQuickAction.isPending || updateQuickAction.isPending
                    ? "Salvando..."
                    : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions && quickActions.length > 0 ? (
          quickActions.map((action: QuickAction) => (
            <Card key={action.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <ZapIcon className="h-4 w-4 mr-2 text-yellow-500" />
                    <CardTitle className="text-base">{action.title}</CardTitle>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(action)}
                    >
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(action.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-xs">
                  {action.actionType}
                </CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <p className="text-sm">{action.description}</p>
                {action.templateContent && (
                  <div className="mt-2 p-2 bg-muted rounded-md text-xs line-clamp-3 font-mono">
                    {action.templateContent}
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleCopy(action.templateContent)}
                >
                  <CopyIcon className="h-4 w-4 mr-2" />
                  Copiar conteúdo
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center p-4 border rounded-md bg-muted/50">
            <ZapIcon className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="mt-2 text-muted-foreground">
              Nenhuma ação rápida encontrada. Clique em "Nova ação rápida" para criar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
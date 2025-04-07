import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Backup } from "@shared/schema";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Download, FileJson, Plus, Save, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

type BackupControlsProps = {
  backups?: Backup[];
  isLoading: boolean;
};

const backupFormSchema = z.object({
  name: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  description: z.string().optional(),
});

export function BackupControls({ backups, isLoading }: BackupControlsProps) {
  const { toast } = useToast();
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [backupToDownload, setBackupToDownload] = useState<Backup | null>(null);
  
  const form = useForm<z.infer<typeof backupFormSchema>>({
    resolver: zodResolver(backupFormSchema),
    defaultValues: {
      name: `Backup ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      description: "",
    },
  });
  
  const createBackupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof backupFormSchema>) => {
      // Adiciona propriedades necessárias para o backend
      const backupData = {
        ...data,
        name: data.name,
        description: data.description || "",
        automatic: false,
        filename: `backup-${new Date().toISOString()}.json`,
      };
      
      const response = await apiRequest("POST", "/api/backups", backupData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Backup criado",
        description: "O backup foi criado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      form.reset();
      setIsCreatingBackup(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar backup",
        description: error.message || "Ocorreu um erro ao criar o backup.",
        variant: "destructive",
      });
    },
  });
  
  const downloadBackupMutation = useMutation({
    mutationFn: async (backupId: number) => {
      const response = await apiRequest("GET", `/api/backups/${backupId}/download`);
      return response.json();
    },
    onSuccess: (data) => {
      // Aqui normalmente seria um download real do arquivo,
      // mas para fins de simulação apenas mostraremos uma notificação
      toast({
        title: "Backup baixado",
        description: "O backup foi baixado com sucesso.",
      });
      setIsDownloading(false);
      setBackupToDownload(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao baixar backup",
        description: error.message || "Ocorreu um erro ao baixar o backup.",
        variant: "destructive",
      });
      setIsDownloading(false);
    },
  });
  
  async function onSubmit(data: z.infer<typeof backupFormSchema>) {
    await createBackupMutation.mutate(data);
  }
  
  function handleDownloadBackup() {
    if (backupToDownload) {
      downloadBackupMutation.mutate(backupToDownload.id);
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-40 mb-6" />
        {Array(3).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-lg font-medium mb-1">Gerenciamento de Backup</h2>
          <p className="text-sm text-gray-500">
            Crie e gerencie backups do sistema. Os backups incluem todos os dados do sistema.
          </p>
        </div>
        <Button 
          onClick={() => setIsCreatingBackup(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white"
        >
          <Save className="h-4 w-4 mr-2" />
          Criar Backup
        </Button>
      </div>
      
      {!backups || backups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Database className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum backup encontrado</h3>
          <p className="text-gray-500 mb-4">Crie seu primeiro backup para proteger seus dados.</p>
          <Button onClick={() => setIsCreatingBackup(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Backup
          </Button>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Data de Criação</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">{backup.name}</TableCell>
                  <TableCell>{backup.description || "—"}</TableCell>
                  <TableCell>
                    {format(new Date(backup.createdAt), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>{backup.fileSize ? `${(backup.fileSize / 1024 / 1024).toFixed(2)} MB` : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBackupToDownload(backup);
                        setIsDownloading(true);
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span className="sr-only">Download</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      
      {/* Create Backup Dialog */}
      <Dialog open={isCreatingBackup} onOpenChange={setIsCreatingBackup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Novo Backup</DialogTitle>
            <DialogDescription>
              Crie um novo backup dos dados do sistema. Este processo pode levar alguns minutos.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Backup</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do backup" {...field} />
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
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Descrição do backup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter className="mt-6">
                <Button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700"
                  disabled={createBackupMutation.isPending}
                >
                  {createBackupMutation.isPending ? "Criando..." : "Criar Backup"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Download Backup Confirmation */}
      <AlertDialog open={isDownloading} onOpenChange={setIsDownloading}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Baixar Backup</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a baixar o backup "{backupToDownload?.name}". Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupToDownload(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDownloadBackup}
              className="bg-primary-600 hover:bg-primary-700"
              disabled={downloadBackupMutation.isPending}
            >
              {downloadBackupMutation.isPending ? "Baixando..." : "Baixar Backup"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
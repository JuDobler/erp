import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lead } from "@shared/schema";
import { legalAreaLabels, leadOriginLabels } from "@shared/schema";
import { DATE_FORMATTER } from "@/lib/constants";
import { MoreHorizontal, PhoneCall, MessageSquare, Mail } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

type LeadCardProps = {
  lead: Lead;
  onDragStart: (e: React.DragEvent, lead: Lead) => void;
  onDragEnd: () => void;
  refetchContacts: () => void;
};

export function LeadCard({ lead, onDragStart, onDragEnd, refetchContacts }: LeadCardProps) {
  const { toast } = useToast();
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [contactNote, setContactNote] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const addContactMutation = useMutation({
    mutationFn: async (note: string) => {
      const response = await apiRequest("POST", `/api/leads/${lead.id}/contacts`, {
        notes: note,
        date: new Date(),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Contato registrado",
        description: "O histórico de contato foi adicionado com sucesso.",
      });
      setContactNote("");
      setShowContactDialog(false);
      refetchContacts();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao registrar contato",
        description: error.message || "Ocorreu um erro ao registrar o contato.",
        variant: "destructive",
      });
    },
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const response = await apiRequest("PUT", `/api/leads/${lead.id}`, {
        status: newStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar lead",
        description: error.message || "Ocorreu um erro ao atualizar o status do lead.",
        variant: "destructive",
      });
    },
  });

  const convertToClientMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/leads/${lead.id}/convert`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead convertido em cliente",
        description: "O lead foi convertido em cliente com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao converter lead",
        description: error.message || "Ocorreu um erro ao converter o lead em cliente.",
        variant: "destructive",
      });
    },
  });

  const deleteLeadMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", `/api/leads/${lead.id}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Lead excluído",
        description: "O lead foi excluído com sucesso.",
      });
      setShowDeleteDialog(false);
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir lead",
        description: error.message || "Ocorreu um erro ao excluir o lead.",
        variant: "destructive",
      });
    },
  });

  const handleAddContact = () => {
    if (contactNote.trim()) {
      addContactMutation.mutate(contactNote);
    }
  };

  const handleMarkAsLost = () => {
    updateLeadStatusMutation.mutate("perdido");
  };

  const handleConvertToClient = () => {
    convertToClientMutation.mutate();
  };

  const handleDeleteLead = () => {
    setShowDeleteDialog(true);
  };

  return (
    <>
      <div
        className="bg-white p-3 rounded-lg shadow-sm cursor-grab active:cursor-grabbing"
        draggable
        onDragStart={(e) => onDragStart(e, lead)}
        onDragEnd={onDragEnd}
      >
        <div className="flex justify-between items-start">
          <h4 className="text-sm font-medium text-gray-800">{lead.name}</h4>
          <span className={`text-xs px-2 py-0.5 rounded bg-${getLegalAreaColor(lead.legalArea)}-100 text-${getLegalAreaColor(lead.legalArea)}-800`}>
            {legalAreaLabels[lead.legalArea]}
          </span>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          <p>Contato: {lead.phone}</p>
          {lead.email && <p className="mt-1">Email: {lead.email}</p>}
          <p className="mt-1">Origem: {leadOriginLabels[lead.origin]}</p>
        </div>

        {lead.followUpDate && (
          <div className="mt-2 text-xs">
            <p className="font-medium text-gray-700">Follow-up:</p>
            <p className="text-amber-600">
              {DATE_FORMATTER.format(new Date(lead.followUpDate))}
            </p>
          </div>
        )}

        <div className="mt-3 flex justify-between items-center">
          <span className="text-xs text-gray-500">
            {DATE_FORMATTER.format(new Date(lead.createdAt))}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 rounded-full"
              onClick={() => setShowContactDialog(true)}
            >
              <MessageSquare className="h-4 w-4 text-gray-400 hover:text-gray-600" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full"
                >
                  <MoreHorizontal className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onSelect={() => window.open(`tel:${lead.phone}`, '_blank')}
                  className="cursor-pointer"
                >
                  <PhoneCall className="mr-2 h-4 w-4" />
                  <span>Ligar</span>
                </DropdownMenuItem>
                {lead.email && (
                  <DropdownMenuItem 
                    onSelect={() => window.open(`mailto:${lead.email}`, '_blank')}
                    className="cursor-pointer"
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Enviar email</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onSelect={() => setShowContactDialog(true)}
                  className="cursor-pointer"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  <span>Registrar contato</span>
                </DropdownMenuItem>
                {lead.status !== "convertido" && (
                  <DropdownMenuItem 
                    onSelect={handleConvertToClient}
                    className="cursor-pointer"
                  >
                    <span>Converter para cliente</span>
                  </DropdownMenuItem>
                )}
                {lead.status !== "perdido" && (
                  <DropdownMenuItem 
                    onSelect={handleMarkAsLost}
                    className="cursor-pointer text-red-600"
                  >
                    <span>Marcar como perdido</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onSelect={handleDeleteLead}
                  className="cursor-pointer text-red-600"
                >
                  <span>Excluir lead</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Contact Dialog */}
      <Dialog open={showContactDialog} onOpenChange={setShowContactDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Registrar Contato</DialogTitle>
            <DialogDescription>
              Adicione informações sobre o contato realizado com {lead.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="notes">Detalhes do contato</Label>
              <Input
                id="notes"
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                placeholder="Detalhe o contato realizado..."
                className="h-24"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddContact} disabled={!contactNote.trim() || addContactMutation.isPending}>
              {addContactMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o lead {lead.name}? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteLeadMutation.mutate()}
              disabled={deleteLeadMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLeadMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function getLegalAreaColor(legalArea: string): string {
  switch (legalArea) {
    case "direito_bancario":
      return "yellow";
    case "direito_empresarial":
      return "purple";
    case "direito_civil":
      return "blue";
    case "direito_criminal":
      return "red";
    case "direito_administrativo":
      return "green";
    case "direito_consumidor":
      return "emerald";
    default:
      return "gray";
  }
}

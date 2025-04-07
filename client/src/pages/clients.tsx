import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Client } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { DATE_FORMATTER } from "@/lib/constants";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Search, Plus, Phone, Mail, FileText, Briefcase, Pencil, Trash } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";

export default function Clients() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isEditingClient, setIsEditingClient] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    document: "",
  });

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest('POST', '/api/clients', clientData);
      return response.json();
    },
    onSuccess: () => {
      setIsAddingClient(false);
      setNewClient({
        name: "",
        phone: "",
        email: "",
        address: "",
        document: "",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente adicionado",
        description: "O cliente foi adicionado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar cliente",
        description: error.message || "Ocorreu um erro ao adicionar o cliente.",
        variant: "destructive",
      });
    },
  });
  
  const updateClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      const response = await apiRequest('PUT', `/api/clients/${selectedClient?.id}`, clientData);
      return response.json();
    },
    onSuccess: () => {
      setIsEditingClient(false);
      setSelectedClient(null);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente atualizado",
        description: "O cliente foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message || "Ocorreu um erro ao atualizar o cliente.",
        variant: "destructive",
      });
    },
  });
  
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      const response = await apiRequest('DELETE', `/api/clients/${clientId}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "Cliente excluído",
        description: "O cliente foi excluído com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Ocorreu um erro ao excluir o cliente.",
        variant: "destructive",
      });
    },
  });

  const handleCreateClient = () => {
    if (!newClient.name || !newClient.phone) {
      toast({
        title: "Campos obrigatórios",
        description: "Nome e telefone são campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }
    createClientMutation.mutate(newClient);
  };
  
  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsEditingClient(true);
  };
  
  const handleUpdateClient = (updatedData: any) => {
    if (!selectedClient) return;
    updateClientMutation.mutate(updatedData);
  };
  
  const handleDeleteClient = (clientId: number) => {
    if (confirm("Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.")) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const filteredClients = clients?.filter((client) => {
    if (searchTerm && !client.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      if (client.email && !client.email.toLowerCase().includes(searchTerm.toLowerCase())) {
        if (!client.phone.includes(searchTerm)) {
          return false;
        }
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-bold">Clientes</CardTitle>
            <CardDescription>
              Gerencie os clientes do escritório
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingClient(true)}
            className="bg-[#1e293b] hover:bg-[#0f172a] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Buscar por nome, email ou telefone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="lista" className="w-full">
            <TabsList className="mb-4 w-full sm:w-auto">
              <TabsTrigger value="lista">Lista</TabsTrigger>
              <TabsTrigger value="cards">Cards</TabsTrigger>
            </TabsList>
            
            <TabsContent value="lista">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead className="hidden md:table-cell">Email</TableHead>
                        <TableHead className="hidden md:table-cell">Documento</TableHead>
                        <TableHead className="hidden lg:table-cell">Cadastro</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8">
                            Nenhum cliente encontrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClients?.map((client) => (
                          <TableRow key={client.id}>
                            <TableCell className="font-medium">{client.name}</TableCell>
                            <TableCell>{client.phone}</TableCell>
                            <TableCell className="hidden md:table-cell">{client.email}</TableCell>
                            <TableCell className="hidden md:table-cell">{client.document}</TableCell>
                            <TableCell className="hidden lg:table-cell">
                              {DATE_FORMATTER.format(new Date(client.createdAt))}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => window.open(`tel:${client.phone}`, '_blank')}
                                  title="Ligar"
                                >
                                  <Phone className="h-4 w-4" />
                                </Button>
                                {client.email && (
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => window.open(`mailto:${client.email}`, '_blank')}
                                    title="Enviar E-mail"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </Button>
                                )}
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setLocation(`/clients/${client.id}/documents`)}
                                  title="Documentos"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setLocation(`/clients/${client.id}/cases`)}
                                  title="Processos"
                                >
                                  <Briefcase className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleEditClient(client)}
                                  title="Editar"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => handleDeleteClient(client.id)}
                                  title="Excluir"
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="cards">
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClients?.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      Nenhum cliente encontrado
                    </div>
                  ) : (
                    filteredClients?.map((client) => (
                      <Card key={client.id} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <CardTitle>{client.name}</CardTitle>
                          {client.email && (
                            <CardDescription className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {client.email}
                            </CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="text-sm space-y-2">
                            <div className="flex items-center">
                              <Phone className="h-3 w-3 mr-2" />
                              <span>{client.phone}</span>
                            </div>
                            {client.document && (
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Doc:</span>
                                <span>{client.document}</span>
                              </div>
                            )}
                            {client.address && (
                              <div className="flex items-center">
                                <span className="font-medium mr-2">Endereço:</span>
                                <span>{client.address}</span>
                              </div>
                            )}
                            <div className="flex items-center text-gray-500 text-xs pt-2">
                              <span>Desde {DATE_FORMATTER.format(new Date(client.createdAt))}</span>
                            </div>
                            <div className="flex justify-end gap-1 mt-3 pt-3 border-t border-gray-100">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => window.open(`tel:${client.phone}`, '_blank')}
                                title="Ligar"
                              >
                                <Phone className="h-3 w-3 mr-1" />
                                Ligar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleEditClient(client)}
                                title="Editar"
                              >
                                <Pencil className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleDeleteClient(client.id)}
                                title="Excluir"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash className="h-3 w-3 mr-1" />
                                Excluir
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Client Dialog */}
      <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo cliente. Os campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="document">Documento (CPF/CNPJ)</Label>
                <Input
                  id="document"
                  value={newClient.document}
                  onChange={(e) => setNewClient({ ...newClient, document: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Endereço</Label>
                <Input
                  id="address"
                  value={newClient.address}
                  onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddingClient(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateClient}
              disabled={createClientMutation.isPending}
              className="bg-[#1e293b] hover:bg-[#0f172a] text-white"
            >
              {createClientMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Client Dialog */}
      <Dialog open={isEditingClient} onOpenChange={setIsEditingClient}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Editar Cliente</DialogTitle>
            <DialogDescription>
              Atualize os dados do cliente. Os campos com * são obrigatórios.
            </DialogDescription>
          </DialogHeader>
          {selectedClient && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="edit-name">Nome *</Label>
                  <Input
                    id="edit-name"
                    value={selectedClient.name}
                    onChange={(e) => setSelectedClient({ ...selectedClient, name: e.target.value })}
                    placeholder="Nome completo"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-phone">Telefone *</Label>
                  <Input
                    id="edit-phone"
                    value={selectedClient.phone}
                    onChange={(e) => setSelectedClient({ ...selectedClient, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-email">Email</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={selectedClient.email || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, email: e.target.value })}
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-document">Documento (CPF/CNPJ)</Label>
                  <Input
                    id="edit-document"
                    value={selectedClient.document || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, document: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-address">Endereço</Label>
                  <Input
                    id="edit-address"
                    value={selectedClient.address || ''}
                    onChange={(e) => setSelectedClient({ ...selectedClient, address: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditingClient(false);
                setSelectedClient(null);
              }}
            >
              Cancelar
            </Button>
            <Button 
              onClick={() => handleUpdateClient(selectedClient)}
              disabled={updateClientMutation.isPending || !selectedClient}
              className="bg-[#1e293b] hover:bg-[#0f172a] text-white"
            >
              {updateClientMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
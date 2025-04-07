import { useState } from "react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Document, documentTypeLabels } from "@shared/schema";
import { useQuery, useMutation, QueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { FileIcon, UploadIcon, FileTextIcon, TrashIcon, FileEditIcon } from "lucide-react";

const queryClient = new QueryClient();

interface DocumentListProps {
  caseId?: number;
  clientId?: number;
}

export function DocumentList({ caseId, clientId }: DocumentListProps) {
  const { toast } = useToast();
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: "",
    description: "",
    type: "contrato",
    fileUrl: "",
    filename: "",
    fileSize: 0,
    caseId: caseId || null,
    clientId: clientId || null,
    caseSearch: "",
  });

  // Fetch cases for the dropdown
  const { data: cases } = useQuery({
    queryKey: ['/api/cases'],
    enabled: isUploadOpen,
  });

  // Fetch documents
  const endpoint = caseId
    ? `/api/cases/${caseId}/documents`
    : clientId
    ? `/api/clients/${clientId}/documents`
    : `/api/documents`;

  const { data: documents, isLoading, error } = useQuery({
    queryKey: [endpoint],
    queryFn: async () => {
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error("Failed to fetch documents");
      }
      return response.json();
    },
  });

  // Create document mutation
  const createDocument = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/documents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      setIsUploadOpen(false);
      setUploadData({
        title: "",
        description: "",
        type: "contrato",
        fileUrl: "",
        filename: "",
        fileSize: 0,
        caseId: caseId || null,
        clientId: clientId || null,
        caseSearch: "",
      });
      toast({
        title: "Documento adicionado",
        description: "O documento foi adicionado com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o documento",
        variant: "destructive",
      });
    },
  });

  // Delete document mutation
  const deleteDocument = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/documents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [endpoint] });
      toast({
        title: "Documento excluído",
        description: "O documento foi excluído com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o documento",
        variant: "destructive",
      });
    },
  });

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we would handle file upload to a storage service
    // For now, we're simulating it with a direct URL
    const simulatedFileUrl = `https://storage.example.com/${uploadData.filename}`;
    
    createDocument.mutate({
      ...uploadData,
      fileUrl: simulatedFileUrl,
      caseId: caseId || null,
      clientId: clientId || null,
    });
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadData({
        ...uploadData,
        filename: file.name,
        fileSize: file.size,
      });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Tem certeza que deseja excluir este documento?")) {
      deleteDocument.mutate(id);
    }
  };

  if (isLoading) return <div>Carregando documentos...</div>;
  if (error) return <div>Erro ao carregar documentos</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Documentos</h3>
        <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
          <DialogTrigger asChild>
            <Button className="bg-black hover:bg-gray-900 text-white">
              <UploadIcon className="h-4 w-4 mr-2" />
              Adicionar documento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar novo documento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={uploadData.title}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, title: e.target.value })
                  }
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de documento</Label>
                <Select
                  value={uploadData.type}
                  onValueChange={(value) =>
                    setUploadData({ ...uploadData, type: value as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(documentTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={uploadData.description || ""}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, description: e.target.value })
                  }
                />
              </div>
              
              {!caseId && (
                <div className="space-y-2">
                  <Label htmlFor="caseId">Processo relacionado</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Digite para buscar um processo"
                      value={uploadData.caseSearch || ""}
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        setUploadData({ ...uploadData, caseSearch: searchTerm });
                      }}
                    />
                    {uploadData.caseSearch && cases && cases.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg max-h-60 overflow-auto border">
                        <div className="p-2 border-b cursor-pointer hover:bg-gray-100" 
                             onClick={() => setUploadData({ 
                               ...uploadData, 
                               caseId: null, 
                               caseSearch: "" 
                             })}>
                          Nenhum
                        </div>
                        {cases
                          .filter((caseItem: any) => 
                            caseItem.title.toLowerCase().includes(uploadData.caseSearch?.toLowerCase() || ""))
                          .map((caseItem: any) => (
                            <div
                              key={caseItem.id}
                              className="p-2 cursor-pointer hover:bg-gray-100"
                              onClick={() => setUploadData({ 
                                ...uploadData, 
                                caseId: caseItem.id, 
                                caseSearch: caseItem.title 
                              })}
                            >
                              {caseItem.title}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {uploadData.caseId && (
                    <div className="text-sm text-muted-foreground">
                      Processo selecionado: {cases?.find((c: any) => c.id === uploadData.caseId)?.title || ""}
                    </div>
                  )}
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="file">Arquivo</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileSelection}
                  required
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="bg-black hover:bg-gray-900 text-white"
                  disabled={createDocument.isPending}
                >
                  {createDocument.isPending ? "Enviando..." : "Enviar documento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {documents && documents.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Tamanho</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((document: Document) => (
              <TableRow key={document.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <FileTextIcon className="h-4 w-4 mr-2" />
                    {document.title}
                  </div>
                </TableCell>
                <TableCell>{documentTypeLabels[document.type as keyof typeof documentTypeLabels]}</TableCell>
                <TableCell>
                  {format(new Date(document.createdAt), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>
                  {(document.fileSize / 1024).toFixed(1)} KB
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <FileIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <FileEditIcon className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center p-4 border rounded-md bg-muted/50">
          <FileTextIcon className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">
            Nenhum documento encontrado. Clique em "Adicionar documento" para incluir um novo.
          </p>
        </div>
      )}
    </div>
  );
}
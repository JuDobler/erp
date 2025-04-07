import { useAuthContext } from "@/lib/auth";
import { DocumentList } from "@/components/documents/document-list";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, Search } from "lucide-react";

export default function DocumentsPage() {
  const { user } = useAuthContext();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch clients for filtering
  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
    queryFn: async () => {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      return response.json();
    },
  });

  // Fetch cases for filtering
  const { data: cases } = useQuery({
    queryKey: ["/api/cases"],
    queryFn: async () => {
      const response = await fetch("/api/cases");
      if (!response.ok) {
        throw new Error("Failed to fetch cases");
      }
      return response.json();
    },
  });

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Documentos</h1>
      </div>

      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4 md:items-center">
        <div className="flex-1 relative">
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
        
        <Button 
          variant="outline" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border rounded-md">
          <div>
            <label className="text-sm font-medium mb-1 block">Tipo de documento</label>
            <Select value={filterType || ""} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os tipos</SelectItem>
                <SelectItem value="contrato">Contrato</SelectItem>
                <SelectItem value="procuracao">Procuração</SelectItem>
                <SelectItem value="parecer">Parecer</SelectItem>
                <SelectItem value="peticao">Petição</SelectItem>
                <SelectItem value="recurso">Recurso</SelectItem>
                <SelectItem value="oficio">Ofício</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Cliente</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todos os clientes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os clientes</SelectItem>
                {clients && clients.map((client: any) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Processo</label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Todos os processos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os processos</SelectItem>
                {cases && cases.map((caseItem: any) => (
                  <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                    {caseItem.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todos os documentos</TabsTrigger>
          <TabsTrigger value="recent">Documentos recentes</TabsTrigger>
          <TabsTrigger value="mine">Meus uploads</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <DocumentList />
        </TabsContent>
        <TabsContent value="recent" className="mt-6">
          <DocumentList />
        </TabsContent>
        <TabsContent value="mine" className="mt-6">
          <DocumentList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
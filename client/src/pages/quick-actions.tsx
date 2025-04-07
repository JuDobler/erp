import { useAuthContext } from "@/lib/auth";
import { QuickActionsPanel } from "@/components/quick-actions/quick-actions-panel";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, ZapIcon, BookIcon, FileTextIcon, FileIcon } from "lucide-react";

export default function QuickActionsPage() {
  const { user } = useAuthContext();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Ações Rápidas</h1>
      </div>

      <div className="flex flex-col space-y-4 md:space-y-0 md:flex-row md:space-x-4 md:items-center">
        <div className="flex-1 relative">
          <Input
            placeholder="Buscar ações rápidas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="templates">Modelos</TabsTrigger>
          <TabsTrigger value="snippets">Trechos</TabsTrigger>
        </TabsList>
        <TabsContent value="all" className="mt-6">
          <QuickActionsPanel />
        </TabsContent>
        <TabsContent value="templates" className="mt-6">
          <QuickActionsPanel />
        </TabsContent>
        <TabsContent value="snippets" className="mt-6">
          <QuickActionsPanel />
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-10">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookIcon className="h-5 w-5 mr-2 text-blue-500" />
              Guia de Uso
            </CardTitle>
            <CardDescription>
              Como utilizar ações rápidas de forma eficiente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              As ações rápidas permitem criar modelos e trechos de texto reutilizáveis para agilizar sua rotina de trabalho.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Crie modelos para documentos comuns como petições e contratos</li>
              <li>Use placeholders como {"{cliente}"} e {"{processo}"}</li>
              <li>Copie rapidamente para a área de transferência</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileTextIcon className="h-5 w-5 mr-2 text-green-500" />
              Modelos Populares
            </CardTitle>
            <CardDescription>
              Modelos mais utilizados pela equipe
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              Acesse rapidamente os modelos mais usados pela equipe jurídica.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Petição inicial para direito do consumidor</li>
              <li>Contrato padrão de prestação de serviços</li>
              <li>Termo de compromisso para acordo extrajudicial</li>
            </ul>
            <Button variant="link" className="text-xs p-0 h-auto">
              Ver todos os modelos populares
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileIcon className="h-5 w-5 mr-2 text-purple-500" />
              Integrações
            </CardTitle>
            <CardDescription>
              Use ações rápidas em outras ferramentas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm">
              As ações rápidas podem ser integradas com suas ferramentas de trabalho favoritas.
            </p>
            <ul className="text-sm list-disc pl-5 space-y-1">
              <li>Microsoft Word via extensão</li>
              <li>Google Docs via plugin</li>
              <li>Exportar como arquivos .docx ou .pdf</li>
            </ul>
            <Button variant="link" className="text-xs p-0 h-auto">
              Configurar integrações
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
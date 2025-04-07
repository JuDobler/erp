import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Case, Client } from "@shared/schema";
import { CaseForm } from "@/components/cases/case-form";
import { CaseDetails } from "@/components/cases/case-details";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Filter, Eye, Briefcase } from "lucide-react";
import { legalAreaLabels } from "@shared/schema";
import { DATE_FORMATTER, CURRENCY_FORMATTER, LEGAL_AREAS } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default function Cases() {
  const [isAddingCase, setIsAddingCase] = useState(false);
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [legalAreaFilter, setLegalAreaFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: cases, isLoading: isCasesLoading } = useQuery<Case[]>({
    queryKey: ['/api/cases'],
  });

  const { data: clients, isLoading: isClientsLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
  });

  const filteredCases = cases?.filter((caseItem: Case) => {
    if (searchTerm && !caseItem.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (legalAreaFilter && legalAreaFilter !== "todas" && caseItem.legalArea !== legalAreaFilter) {
      return false;
    }
    if (statusFilter && statusFilter !== "todos" && caseItem.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const getClientName = (clientId: number) => {
    const client = clients?.find((c: Client) => c.id === clientId);
    return client ? client.name : "Cliente não encontrado";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Gestão de Casos</CardTitle>
          <Button 
            onClick={() => setIsAddingCase(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Caso
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-grow md:flex-grow-0 relative">
              <Input
                placeholder="Buscar casos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <div className="absolute left-3 top-2.5 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
            </div>

            <div>
              <Select
                value={legalAreaFilter}
                onValueChange={setLegalAreaFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas áreas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas áreas</SelectItem>
                  {LEGAL_AREAS.map((area) => (
                    <SelectItem key={area.value} value={area.value}>
                      {area.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="closed">Encerrado</SelectItem>
                  <SelectItem value="suspended">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isCasesLoading || isClientsLoading ? (
            <div className="space-y-4">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCases?.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCases.map((caseItem: Case) => (
                    <TableRow key={caseItem.id}>
                      <TableCell className="font-medium">{caseItem.title}</TableCell>
                      <TableCell>{getClientName(caseItem.clientId)}</TableCell>
                      <TableCell>{legalAreaLabels[caseItem.legalArea]}</TableCell>
                      <TableCell>
                        {caseItem.value ? CURRENCY_FORMATTER.format(Number(caseItem.value)) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${caseItem.status === 'ativo' ? 'bg-green-100 text-green-800' :
                            caseItem.status === 'arquivado' ? 'bg-gray-100 text-gray-800' :
                            caseItem.status === 'ganho' ? 'bg-blue-100 text-blue-800' :
                            caseItem.status === 'perdido' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'}`}>
                          {caseItem.status === 'ativo' ? 'Ativo' :
                            caseItem.status === 'arquivado' ? 'Arquivado' : 
                            caseItem.status === 'ganho' ? 'Ganho' :
                            caseItem.status === 'perdido' ? 'Perdido' :
                            caseItem.status === 'aguardando_documentos' ? 'Aguardando Documentos' :
                            caseItem.status === 'aguardando_decisao' ? 'Aguardando Decisão' : 
                            'Em Recurso'}
                        </div>
                      </TableCell>
                      <TableCell>{DATE_FORMATTER.format(new Date(caseItem.createdAt))}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedCase(caseItem)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum caso encontrado</h3>
              <p className="text-gray-500 mb-4">Comece criando um novo caso ou ajuste os filtros de busca.</p>
              <Button onClick={() => setIsAddingCase(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Caso
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Case Dialog */}
      <CaseForm
        open={isAddingCase}
        onOpenChange={(open) => setIsAddingCase(open)}
      />

      {/* Case Details Dialog */}
      {selectedCase && (
        <CaseDetails
          caseData={selectedCase}
          open={!!selectedCase}
          onOpenChange={(open) => !open && setSelectedCase(null)}
        />
      )}
    </div>
  );
}

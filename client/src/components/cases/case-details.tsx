import { useQuery, useMutation } from "@tanstack/react-query";
import { Case, Client, User, Task, Transaction } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { legalAreaLabels } from "@shared/schema";
import { DATE_FORMATTER, CURRENCY_FORMATTER } from "@/lib/constants";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  CalendarDays, 
  CircleDollarSign, 
  ClipboardCheck, 
  File, 
  Loader2, 
  UserCheck 
} from "lucide-react";

type CaseDetailsProps = {
  caseData: Case;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CaseDetails({ caseData, open, onOpenChange }: CaseDetailsProps) {
  const { toast } = useToast();

  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['/api/clients', caseData.clientId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/clients/${caseData.clientId}`);
      return response.json();
    },
    enabled: open,
  });

  const { data: lawyer, isLoading: isLawyerLoading } = useQuery({
    queryKey: ['/api/users', caseData.assignedToId],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/users/${caseData.assignedToId}`);
      return response.json();
    },
    enabled: open && !!caseData.assignedToId,
  });

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['/api/tasks/case', caseData.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/tasks/case/${caseData.id}`);
      return response.json();
    },
    enabled: open,
  });

  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['/api/transactions/case', caseData.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/transactions/case/${caseData.id}`);
      return response.json();
    },
    enabled: open,
  });

  const updateCaseStatusMutation = useMutation({
    mutationFn: async (status: string) => {
      const response = await apiRequest('PATCH', `/api/cases/${caseData.id}`, { status });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status do caso foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/cases'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status do caso.",
        variant: "destructive",
      });
    },
  });

  const isLoading = isClientLoading || isLawyerLoading || isTasksLoading || isTransactionsLoading;

  const calculateTotals = () => {
    if (!transactions) return { income: 0, expenses: 0, balance: 0 };
    
    const income = transactions
      .filter((t: Transaction) => t.type === 'receita')
      .reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0);
    
    const expenses = transactions
      .filter((t: Transaction) => t.type === 'despesa')
      .reduce((acc: number, t: Transaction) => acc + Number(t.amount), 0);
    
    return {
      income,
      expenses,
      balance: income - expenses
    };
  };

  const totals = calculateTotals();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{caseData.title}</DialogTitle>
          <DialogDescription className="flex items-center gap-2 text-sm font-medium mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
              ${caseData.status === 'ativo' || caseData.status === 'em_recurso' ? 'bg-green-100 text-green-800' :
                caseData.status === 'arquivado' || caseData.status === 'ganho' || caseData.status === 'perdido' ? 'bg-gray-100 text-gray-800' :
                'bg-yellow-100 text-yellow-800'}`}>
              {caseData.status === 'ativo' ? 'Ativo' :
               caseData.status === 'aguardando_documentos' ? 'Aguardando Documentos' :
               caseData.status === 'aguardando_decisao' ? 'Aguardando Decisão' :
               caseData.status === 'em_recurso' ? 'Em Recurso' :
               caseData.status === 'arquivado' ? 'Arquivado' :
               caseData.status === 'ganho' ? 'Ganho' : 
               caseData.status === 'perdido' ? 'Perdido' : 'Desconhecido'}
            </span>
            <span>•</span>
            <span>{legalAreaLabels[caseData.legalArea]}</span>
            <span>•</span>
            <span>Criado em {DATE_FORMATTER.format(new Date(caseData.createdAt))}</span>
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="tasks">Tarefas</TabsTrigger>
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
              <TabsTrigger value="docs">Documentos</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <UserCheck className="h-4 w-4 mr-2 text-primary" />
                      Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {client ? (
                      <div>
                        <p className="text-lg font-medium">{client.name}</p>
                        <p className="text-sm text-gray-500">{client.email}</p>
                        <p className="text-sm text-gray-500">{client.phone}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Cliente não encontrado</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center">
                      <UserCheck className="h-4 w-4 mr-2 text-primary" />
                      Advogado Responsável
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {lawyer ? (
                      <div>
                        <p className="text-lg font-medium">{lawyer.name}</p>
                        <p className="text-sm text-gray-500">{lawyer.email || lawyer.username}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Não atribuído</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <File className="h-4 w-4 mr-2 text-primary" />
                    Descrição do Caso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">
                    {caseData.description || "Sem descrição."}
                  </p>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between mt-6">
                <div>
                  {caseData.value && (
                    <div className="flex items-center">
                      <CircleDollarSign className="h-5 w-5 text-primary mr-2" />
                      <span className="font-medium">Valor: {CURRENCY_FORMATTER.format(Number(caseData.value))}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  {(caseData.status === 'ativo' || caseData.status === 'em_recurso') && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => updateCaseStatusMutation.mutate('aguardando_documentos')}
                        disabled={updateCaseStatusMutation.isPending}
                      >
                        Aguardar Documentos
                      </Button>
                      <Button
                        variant="default"
                        onClick={() => updateCaseStatusMutation.mutate('arquivado')}
                        disabled={updateCaseStatusMutation.isPending}
                      >
                        Arquivar
                      </Button>
                    </>
                  )}
                  {(caseData.status === 'aguardando_documentos' || caseData.status === 'aguardando_decisao') && (
                    <Button
                      variant="default"
                      onClick={() => updateCaseStatusMutation.mutate('ativo')}
                      disabled={updateCaseStatusMutation.isPending}
                    >
                      Reativar
                    </Button>
                  )}
                  {caseData.status === 'arquivado' && (
                    <Button
                      variant="outline"
                      onClick={() => updateCaseStatusMutation.mutate('ativo')}
                      disabled={updateCaseStatusMutation.isPending}
                    >
                      Reabrir
                    </Button>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <ClipboardCheck className="h-4 w-4 mr-2 text-primary" />
                    Tarefas Relacionadas
                  </CardTitle>
                  <CardDescription>
                    Lista de tarefas relacionadas a este caso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!tasks || tasks.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Não há tarefas associadas a este caso.
                    </p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Responsável</TableHead>
                            <TableHead>Prazo</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tasks.map((task: Task) => (
                            <TableRow key={task.id}>
                              <TableCell className="font-medium">{task.description}</TableCell>
                              <TableCell>{task.assignedToId || "Não atribuído"}</TableCell>
                              <TableCell>
                                {task.deadline && DATE_FORMATTER.format(new Date(task.deadline))}
                              </TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${task.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {task.completed ? 'Concluída' : 'Pendente'}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="financial" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Receitas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-green-600">
                      {CURRENCY_FORMATTER.format(totals.income)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Despesas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xl font-bold text-red-600">
                      {CURRENCY_FORMATTER.format(totals.expenses)}
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Saldo</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className={`text-xl font-bold ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {CURRENCY_FORMATTER.format(totals.balance)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <CircleDollarSign className="h-4 w-4 mr-2 text-primary" />
                    Transações Financeiras
                  </CardTitle>
                  <CardDescription>
                    Lista de transações relacionadas a este caso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!transactions || transactions.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-8">
                      Não há transações financeiras associadas a este caso.
                    </p>
                  ) : (
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Data</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction: Transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="font-medium">{transaction.description}</TableCell>
                              <TableCell>
                                <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                  ${transaction.type === 'receita' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                                </div>
                              </TableCell>
                              <TableCell>{CURRENCY_FORMATTER.format(Number(transaction.amount))}</TableCell>
                              <TableCell>{DATE_FORMATTER.format(new Date(transaction.createdAt))}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="docs" className="space-y-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center">
                    <File className="h-4 w-4 mr-2 text-primary" />
                    Documentos do Caso
                  </CardTitle>
                  <CardDescription>
                    Gerenciamento de documentos relacionados a este caso
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 text-center py-8">
                    Funcionalidade de gerenciamento de documentos em desenvolvimento.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  BarChart2, 
  DownloadIcon, 
  Users, 
  Briefcase, 
  CheckSquare, 
  DollarSign 
} from "lucide-react";
import { LeadsChart } from "@/components/charts/leads-chart";
import { FinancialChart } from "@/components/charts/financial-chart";
import { CURRENCY_FORMATTER, LEAD_STATUSES } from "@/lib/constants";
import { legalAreaLabels, leadOriginLabels, userRoleLabels } from "@shared/schema";

export default function Reports() {
  const [periodFilter, setPeriodFilter] = useState("month");
  const [reportTab, setReportTab] = useState("leads");
  
  const { data: leads, isLoading: isLeadsLoading } = useQuery({
    queryKey: ['/api/leads'],
  });
  
  const { data: cases, isLoading: isCasesLoading } = useQuery({
    queryKey: ['/api/cases'],
  });
  
  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });
  
  const { data: transactions, isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['/api/transactions'],
  });

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
  });

  const isLoading = isLeadsLoading || isCasesLoading || isTasksLoading || isTransactionsLoading || isUsersLoading;

  // Calculate lead statistics
  const leadsByStatus = leads?.reduce((acc: Record<string, number>, lead: any) => {
    acc[lead.status] = (acc[lead.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const leadsByLegalArea = leads?.reduce((acc: Record<string, number>, lead: any) => {
    acc[lead.legalArea] = (acc[lead.legalArea] || 0) + 1;
    return acc;
  }, {}) || {};

  const leadsByOrigin = leads?.reduce((acc: Record<string, number>, lead: any) => {
    acc[lead.origin] = (acc[lead.origin] || 0) + 1;
    return acc;
  }, {}) || {};

  // Calculate financial statistics
  const revenue = transactions
    ?.filter((t: any) => t.type === 'receita')
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0;

  const expenses = transactions
    ?.filter((t: any) => t.type === 'despesa')
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0;

  const pendingRevenue = transactions
    ?.filter((t: any) => t.type === 'receita' && !t.paid)
    .reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0;

  // Tasks statistics
  const completedTasks = tasks?.filter((t: any) => t.completed).length || 0;
  const pendingTasks = tasks?.filter((t: any) => !t.completed).length || 0;
  const totalTasks = tasks?.length || 0;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const highPriorityTasks = tasks?.filter((t: any) => t.priority === 'alta' || t.priority === 'urgente').length || 0;

  return (
    <div className="space-y-6">
      <Card className="bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Relatórios</CardTitle>
          <div className="flex items-center space-x-2">
            <Select
              value={periodFilter}
              onValueChange={setPeriodFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Últimos 7 dias</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
                <SelectItem value="all">Todo período</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <DownloadIcon className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="leads" value={reportTab} onValueChange={setReportTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="leads">
                <Users className="h-4 w-4 mr-2" />
                Leads e Clientes
              </TabsTrigger>
              <TabsTrigger value="cases">
                <Briefcase className="h-4 w-4 mr-2" />
                Casos
              </TabsTrigger>
              <TabsTrigger value="tasks">
                <CheckSquare className="h-4 w-4 mr-2" />
                Tarefas
              </TabsTrigger>
              <TabsTrigger value="financial">
                <DollarSign className="h-4 w-4 mr-2" />
                Financeiro
              </TabsTrigger>
            </TabsList>
            
            {/* Leads Report */}
            <TabsContent value="leads" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Status dos Leads</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        {LEAD_STATUSES.map(status => (
                          <div key={status.value} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <span className={`h-3 w-3 ${status.color} rounded-full mr-2`}></span>
                              <span>{status.label}</span>
                            </div>
                            <span className="font-medium">{leadsByStatus[status.value] || 0}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Áreas Jurídicas</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(legalAreaLabels).map(([key, label]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span>{label}</span>
                            <span className="font-medium">{leadsByLegalArea[key] || 0}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Origem dos Leads</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(leadOriginLabels).map(([key, label]) => (
                          <div key={key} className="flex justify-between items-center">
                            <span>{label}</span>
                            <span className="font-medium">{leadsByOrigin[key] || 0}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Evolução dos Leads</h3>
                  <div className="h-80">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <LeadsChart leads={leads || []} periodFilter={periodFilter} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Cases Report */}
            <TabsContent value="cases" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Casos por Status</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
                            <span>Ativos</span>
                          </div>
                          <span className="font-medium">
                            {cases?.filter((c: any) => c.status === 'active').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-gray-500 rounded-full mr-2"></span>
                            <span>Encerrados</span>
                          </div>
                          <span className="font-medium">
                            {cases?.filter((c: any) => c.status === 'closed').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></span>
                            <span>Suspensos</span>
                          </div>
                          <span className="font-medium">
                            {cases?.filter((c: any) => c.status === 'suspended').length || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Áreas Jurídicas</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        {Object.entries(legalAreaLabels).map(([key, label]) => {
                          const count = cases?.filter((c: any) => c.legalArea === key).length || 0;
                          return (
                            <div key={key} className="flex justify-between items-center">
                              <span>{label}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Advogados Responsáveis</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        {users?.filter((u: any) => u.role === 'advogado' || u.role === 'admin').map((user: any) => {
                          const count = cases?.filter((c: any) => c.assignedToId === user.id).length || 0;
                          return (
                            <div key={user.id} className="flex justify-between items-center">
                              <span>{user.name}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Valor Total dos Casos</h3>
                  <div className="flex justify-center items-center h-40">
                    {isLoading ? (
                      <Skeleton className="h-16 w-48" />
                    ) : (
                      <div className="text-center">
                        <p className="text-4xl font-bold text-primary-600">
                          {CURRENCY_FORMATTER.format(
                            cases?.reduce((sum: number, c: any) => sum + Number(c.value || 0), 0) || 0
                          )}
                        </p>
                        <p className="text-gray-500 mt-2">Valor total de todos os casos</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Tasks Report */}
            <TabsContent value="tasks" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Status das Tarefas</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
                            <span>Concluídas</span>
                          </div>
                          <span className="font-medium">{completedTasks}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></span>
                            <span>Pendentes</span>
                          </div>
                          <span className="font-medium">{pendingTasks}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-red-500 rounded-full mr-2"></span>
                            <span>Alta Prioridade</span>
                          </div>
                          <span className="font-medium">{highPriorityTasks}</span>
                        </div>
                        <div className="mt-4 space-y-1">
                          <p className="text-sm text-gray-500">Taxa de Conclusão</p>
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div 
                              className="h-full bg-green-500 rounded-full" 
                              style={{ width: `${completionRate}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-500 text-right">{completionRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Tarefas por Prioridade</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-red-500 rounded-full mr-2"></span>
                            <span>Urgente</span>
                          </div>
                          <span className="font-medium">
                            {tasks?.filter((t: any) => t.priority === 'urgente').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-yellow-500 rounded-full mr-2"></span>
                            <span>Alta</span>
                          </div>
                          <span className="font-medium">
                            {tasks?.filter((t: any) => t.priority === 'alta').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-blue-500 rounded-full mr-2"></span>
                            <span>Média</span>
                          </div>
                          <span className="font-medium">
                            {tasks?.filter((t: any) => t.priority === 'media').length || 0}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className="h-3 w-3 bg-green-500 rounded-full mr-2"></span>
                            <span>Baixa</span>
                          </div>
                          <span className="font-medium">
                            {tasks?.filter((t: any) => t.priority === 'baixa').length || 0}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Responsáveis</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-3">
                        {users?.map((user: any) => {
                          const count = tasks?.filter((t: any) => t.assignedToId === user.id).length || 0;
                          if (count > 0) {
                            return (
                              <div key={user.id} className="flex justify-between items-center">
                                <div className="flex items-center">
                                  <span>{user.name}</span>
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({userRoleLabels[user.role]})
                                  </span>
                                </div>
                                <span className="font-medium">{count}</span>
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Tarefas com Prazos Próximos</h3>
                  {isLoading ? (
                    <Skeleton className="h-40 w-full" />
                  ) : (
                    <div className="space-y-3">
                      {tasks
                        ?.filter((t: any) => t.deadline && !t.completed)
                        .sort((a: any, b: any) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                        .slice(0, 5)
                        .map((task: any) => (
                          <div key={task.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <p className="font-medium">{task.title}</p>
                              <p className="text-sm text-gray-500">
                                Prazo: {new Date(task.deadline).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium
                              ${task.priority === 'urgente' ? 'bg-red-100 text-red-800' :
                                task.priority === 'alta' ? 'bg-yellow-100 text-yellow-800' :
                                task.priority === 'media' ? 'bg-blue-100 text-blue-800' :
                                'bg-green-100 text-green-800'}`}>
                              {task.priority === 'urgente' ? 'Urgente' :
                                task.priority === 'alta' ? 'Alta' :
                                task.priority === 'media' ? 'Média' : 'Baixa'}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Financial Report */}
            <TabsContent value="financial" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Card className="bg-green-50">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Receitas</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-green-600">
                            {CURRENCY_FORMATTER.format(revenue)}
                          </p>
                          <p className="text-gray-500 mt-1">Total de receitas</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Recebido</span>
                            <span className="font-medium text-green-600">
                              {CURRENCY_FORMATTER.format(revenue - pendingRevenue)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>A receber</span>
                            <span className="font-medium text-yellow-600">
                              {CURRENCY_FORMATTER.format(pendingRevenue)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-red-50">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Despesas</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className="text-3xl font-bold text-red-600">
                            {CURRENCY_FORMATTER.format(expenses)}
                          </p>
                          <p className="text-gray-500 mt-1">Total de despesas</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span>Pago</span>
                            <span className="font-medium text-red-600">
                              {CURRENCY_FORMATTER.format(
                                transactions
                                  ?.filter((t: any) => t.type === 'despesa' && t.paid)
                                  .reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span>A pagar</span>
                            <span className="font-medium text-yellow-600">
                              {CURRENCY_FORMATTER.format(
                                transactions
                                  ?.filter((t: any) => t.type === 'despesa' && !t.paid)
                                  .reduce((acc: number, t: any) => acc + Number(t.amount), 0) || 0
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="bg-blue-50">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-medium mb-4">Balanço</h3>
                    {isLoading ? (
                      <Skeleton className="h-40 w-full" />
                    ) : (
                      <div className="space-y-4">
                        <div className="text-center">
                          <p className={`text-3xl font-bold ${revenue > expenses ? 'text-green-600' : 'text-red-600'}`}>
                            {CURRENCY_FORMATTER.format(revenue - expenses)}
                          </p>
                          <p className="text-gray-500 mt-1">Receitas - Despesas</p>
                        </div>
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span>Receitas</span>
                            <span>Despesas</span>
                          </div>
                          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                            {revenue + expenses > 0 && (
                              <>
                                <div 
                                  className="h-full bg-green-500 float-left" 
                                  style={{ width: `${(revenue / (revenue + expenses)) * 100}%` }}
                                ></div>
                                <div 
                                  className="h-full bg-red-500 float-left" 
                                  style={{ width: `${(expenses / (revenue + expenses)) * 100}%` }}
                                ></div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-lg font-medium mb-4">Evolução Financeira</h3>
                  <div className="h-80">
                    {isLoading ? (
                      <Skeleton className="h-full w-full" />
                    ) : (
                      <FinancialChart transactions={transactions || []} periodFilter={periodFilter} />
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

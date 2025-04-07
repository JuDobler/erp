import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Task, Client, Case } from "@shared/schema";
import { TaskForm } from "@/components/tasks/task-form";
import { TaskCard } from "@/components/tasks/task-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Filter, CheckSquare, Clock } from "lucide-react";
import { TASK_PRIORITIES } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/lib/auth";

export default function Tasks() {
  const { user } = useAuthContext();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [caseFilter, setCaseFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: tasks, isLoading: isTasksLoading } = useQuery({
    queryKey: ['/api/tasks'],
  });

  const { data: myTasks, isLoading: isMyTasksLoading } = useQuery({
    queryKey: ['/api/tasks/my'],
    enabled: !!user,
  });

  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  const { data: cases, isLoading: isCasesLoading } = useQuery({
    queryKey: ['/api/cases'],
  });

  const isLoading = isTasksLoading || isMyTasksLoading || isClientsLoading || isCasesLoading;

  const filterTasks = (taskList: Task[] | undefined) => {
    if (!taskList) return [];
    return taskList.filter((task) => {
      if (searchTerm && !task.title.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (priorityFilter && priorityFilter !== "todas" && task.priority !== priorityFilter) {
        return false;
      }
      if (clientFilter && clientFilter !== "todos" && task.clientId !== parseInt(clientFilter)) {
        return false;
      }
      if (caseFilter && caseFilter !== "todos" && task.caseId !== parseInt(caseFilter)) {
        return false;
      }
      return true;
    });
  };

  const filteredAllTasks = filterTasks(tasks);
  const filteredMyTasks = filterTasks(myTasks);
  const completedTasks = filterTasks(tasks)?.filter(task => task.completed) || [];
  const pendingTasks = filterTasks(tasks)?.filter(task => !task.completed) || [];
  const upcomingTasks = pendingTasks
    .filter(task => task.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime());

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Gestão de Tarefas</CardTitle>
          <Button 
            onClick={() => setIsAddingTask(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Tarefa
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-grow md:flex-grow-0 relative">
              <Input
                placeholder="Buscar tarefas..."
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
                value={priorityFilter}
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todas prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas prioridades</SelectItem>
                  {TASK_PRIORITIES.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={clientFilter}
                onValueChange={setClientFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos clientes</SelectItem>
                  {clients?.map((client: Client) => (
                    <SelectItem key={client.id} value={client.id.toString()}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={caseFilter}
                onValueChange={setCaseFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos casos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos casos</SelectItem>
                  {cases?.map((caseItem: Case) => (
                    <SelectItem key={caseItem.id} value={caseItem.id.toString()}>
                      {caseItem.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="my">Minhas Tarefas</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="completed">Concluídas</TabsTrigger>
              <TabsTrigger value="upcoming">Próximas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : filteredAllTasks?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAllTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      clients={clients}
                      cases={cases}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma tarefa encontrada</h3>
                  <p className="text-gray-500 mb-4">Comece criando uma nova tarefa ou ajuste os filtros de busca.</p>
                  <Button onClick={() => setIsAddingTask(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Tarefa
                  </Button>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="my" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : filteredMyTasks?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredMyTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      clients={clients}
                      cases={cases}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma tarefa atribuída a você</h3>
                  <p className="text-gray-500 mb-4">As tarefas atribuídas a você aparecerão aqui.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : pendingTasks?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      clients={clients}
                      cases={cases}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma tarefa pendente</h3>
                  <p className="text-gray-500 mb-4">Todas as tarefas estão concluídas.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : completedTasks?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      clients={clients}
                      cases={cases}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckSquare className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma tarefa concluída</h3>
                  <p className="text-gray-500 mb-4">Complete algumas tarefas para vê-las aqui.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="upcoming" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Array(6).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-40 w-full" />
                  ))}
                </div>
              ) : upcomingTasks?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {upcomingTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      clients={clients}
                      cases={cases}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Clock className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma tarefa com prazo definido</h3>
                  <p className="text-gray-500 mb-4">Adicione prazos às tarefas para vê-las aqui.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Task Dialog */}
      <TaskForm
        open={isAddingTask}
        onOpenChange={(open) => setIsAddingTask(open)}
      />
    </div>
  );
}

import { useMutation } from "@tanstack/react-query";
import { Task, Client, Case } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Clock, UserCheck, Briefcase, AlertCircle } from "lucide-react";
import { taskPriorityLabels } from "@shared/schema";
import { DATE_FORMATTER } from "@/lib/constants";

type TaskCardProps = {
  task: Task;
  clients?: Client[];
  cases?: Case[];
};

export function TaskCard({ task, clients, cases }: TaskCardProps) {
  const { toast } = useToast();

  const toggleTaskMutation = useMutation({
    mutationFn: async (completed: boolean) => {
      const response = await apiRequest('PATCH', `/api/tasks/${task.id}`, { completed });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: task.completed ? "Tarefa desmarcada" : "Tarefa concluída",
        description: task.completed ? "A tarefa foi marcada como pendente." : "A tarefa foi marcada como concluída.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/my'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar a tarefa.",
        variant: "destructive",
      });
    },
  });

  const getClientName = (clientId?: number) => {
    if (!clientId || !clients) return "";
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? client.name : "";
  };

  const getCaseName = (caseId?: number) => {
    if (!caseId || !cases) return "";
    const caseItem = cases.find((c: Case) => c.id === caseId);
    return caseItem ? caseItem.title : "";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'baixa':
        return 'bg-green-100 text-green-800';
      case 'media':
        return 'bg-blue-100 text-blue-800';
      case 'alta':
        return 'bg-orange-100 text-orange-800';
      case 'urgente':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = () => {
    if (!task.deadline) return false;
    const now = new Date();
    const dueDate = new Date(task.deadline);
    return dueDate < now && !task.completed;
  };

  return (
    <Card className={`overflow-hidden ${task.completed ? 'bg-gray-50' : ''}`}>
      <CardHeader className="p-3 pb-0 flex flex-row items-start gap-2">
        <div>
          <Checkbox 
            checked={task.completed}
            onCheckedChange={(checked) => {
              toggleTaskMutation.mutate(!!checked);
            }}
            disabled={toggleTaskMutation.isPending}
            className="mt-1"
          />
        </div>
        <div className="flex-1">
          <h3 
            className={`font-medium text-base ${task.completed ? 'line-through text-gray-500' : ''}`}
          >
            {task.title}
          </h3>
          {task.description && (
            <p className={`text-sm mt-1 ${task.completed ? 'text-gray-500' : 'text-gray-600'}`}>
              {task.description}
            </p>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex items-center flex-wrap gap-2 mt-1">
          <Badge className={getPriorityColor(task.priority)}>
            {taskPriorityLabels[task.priority]}
          </Badge>
          
          {task.deadline && (
            <Badge variant={isOverdue() ? "destructive" : "outline"} className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {DATE_FORMATTER.format(new Date(task.deadline))}
            </Badge>
          )}
        </div>
        
        {(task.clientId || task.caseId || task.assignedToId) && (
          <div className="mt-3 text-sm text-gray-500 space-y-1">
            {task.clientId && (
              <div className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                <span>{getClientName(task.clientId)}</span>
              </div>
            )}
            
            {task.caseId && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-3.5 w-3.5" />
                <span>{getCaseName(task.caseId)}</span>
              </div>
            )}
            
            {task.assignedToId && (
              <div className="flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5" />
                <span>Atribuído a: {task.assignedToId}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="p-3 pt-0 flex justify-between">
        <div className="text-xs text-gray-400">
          {task.createdAt && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Criada em {DATE_FORMATTER.format(new Date(task.createdAt))}</span>
            </div>
          )}
        </div>
        
        {isOverdue() && (
          <div className="text-xs text-red-500 flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            <span>Atrasada</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
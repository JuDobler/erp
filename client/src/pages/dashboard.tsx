import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, Briefcase, CheckSquare, DollarSign,
  AlertCircle
} from "lucide-react";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CURRENCY_FORMATTER } from "@/lib/constants";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const { user } = useAuthContext();
  
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

  const pendingTasks = tasks?.filter(task => !task.completed) || [];
  
  const revenue = transactions
    ?.filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + Number(t.amount), 0) || 0;

  // Chart data
  const chartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    datasets: [
      {
        label: 'Novos Leads',
        data: [3, 5, 2, 4, 6, 2, 1],
        backgroundColor: 'rgba(44, 82, 130, 0.2)',
        borderColor: 'rgba(44, 82, 130, 1)',
        tension: 0.4,
      },
      {
        label: 'Leads Convertidos',
        data: [1, 2, 0, 1, 3, 0, 1],
        backgroundColor: 'rgba(56, 161, 105, 0.2)',
        borderColor: 'rgba(56, 161, 105, 1)',
        tension: 0.4,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Leads Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Leads</h3>
                {isLeadsLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{leads?.length || 0}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Este mês</p>
                <p className="text-sm font-medium text-green-600">+8.2%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div className="h-full bg-primary-600 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cases Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Briefcase className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Casos ativos</h3>
                {isCasesLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{cases?.length || 0}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Este mês</p>
                <p className="text-sm font-medium text-blue-600">+2.5%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div className="h-full bg-purple-600 rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Tarefas pendentes</h3>
                {isTasksLoading ? (
                  <Skeleton className="h-8 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{pendingTasks.length}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Esta semana</p>
                <p className="text-sm font-medium text-yellow-600">+12.3%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div className="h-full bg-green-600 rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Receita mensal</h3>
                {isTransactionsLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{CURRENCY_FORMATTER.format(revenue)}</p>
                )}
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Este mês</p>
                <p className="text-sm font-medium text-green-600">+5.4%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: '82%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Análise de Leads</CardTitle>
              <div className="flex space-x-2">
                <div className="px-2 py-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-md">Semana</div>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-md cursor-pointer">Mês</div>
                <div className="px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-md cursor-pointer">Ano</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-medium">Tarefas recentes</CardTitle>
              <div className="text-sm text-primary-600 hover:text-primary-800 cursor-pointer">
                Ver todas
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {isTasksLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Skeleton className="h-3 w-3 rounded-full mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-1" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))
              ) : pendingTasks.length > 0 ? (
                pendingTasks.slice(0, 4).map((task) => (
                  <div key={task.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-block h-3 w-3 rounded-full 
                        ${task.priority === 'urgente' ? 'bg-red-500' : 
                          task.priority === 'alta' ? 'bg-yellow-500' : 
                          task.priority === 'media' ? 'bg-blue-500' : 'bg-green-500'}`}
                      ></span>
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-800">{task.title}</p>
                      <p className="text-xs text-gray-500">
                        {task.deadline ? `Vence em ${new Date(task.deadline).toLocaleDateString('pt-BR')}` : 'Sem prazo definido'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-300 mb-2" />
                  <p className="text-gray-500">Nenhuma tarefa pendente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

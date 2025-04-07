import { useState } from 'react';
import { Lead, leadStatusLabels, leadOriginLabels } from '@shared/schema';
import { Pie, Bar } from 'react-chartjs-2';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

type LeadsChartProps = {
  leads: Lead[];
};

export function LeadsChart({ leads }: LeadsChartProps) {
  const [chartType, setChartType] = useState<'status' | 'origin'>('status');
  
  // Função para gerar cores de base com opacidade
  const generateColors = (count: number, opacity: number = 0.7) => {
    const baseColors = [
      `rgba(59, 130, 246, ${opacity})`,   // Azul
      `rgba(16, 185, 129, ${opacity})`,   // Verde
      `rgba(249, 115, 22, ${opacity})`,   // Laranja
      `rgba(236, 72, 153, ${opacity})`,   // Rosa
      `rgba(139, 92, 246, ${opacity})`,   // Roxo
      `rgba(234, 179, 8, ${opacity})`,    // Amarelo
      `rgba(239, 68, 68, ${opacity})`,    // Vermelho
      `rgba(20, 184, 166, ${opacity})`,   // Turquesa
    ];
    
    // Repetir as cores se houver mais categorias que cores
    return Array(count).fill(0).map((_, i) => baseColors[i % baseColors.length]);
  };
  
  // Dados agrupados por status
  const prepareStatusChartData = () => {
    const statusCounts: Record<string, number> = {};
    
    leads.forEach(lead => {
      if (statusCounts[lead.status]) {
        statusCounts[lead.status]++;
      } else {
        statusCounts[lead.status] = 1;
      }
    });
    
    const labels = Object.keys(statusCounts).map(status => leadStatusLabels[status as keyof typeof leadStatusLabels]);
    const data = Object.values(statusCounts);
    const backgroundColor = generateColors(labels.length);
    
    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor,
          borderWidth: 1,
        },
      ],
    };
  };
  
  // Dados agrupados por origem
  const prepareOriginChartData = () => {
    const originCounts: Record<string, number> = {};
    
    leads.forEach(lead => {
      if (originCounts[lead.origin]) {
        originCounts[lead.origin]++;
      } else {
        originCounts[lead.origin] = 1;
      }
    });
    
    const sortedEntries = Object.entries(originCounts).sort((a, b) => b[1] - a[1]);
    const labels = sortedEntries.map(([origin]) => leadOriginLabels[origin as keyof typeof leadOriginLabels]);
    const data = sortedEntries.map(([_, count]) => count);
    
    return {
      labels,
      datasets: [
        {
          label: 'Leads por Origem',
          data,
          backgroundColor: generateColors(labels.length, 0.6),
          borderColor: generateColors(labels.length, 1),
          borderWidth: 1,
        },
      ],
    };
  };
  
  const statusChartData = prepareStatusChartData();
  const originChartData = prepareOriginChartData();
  
  const pieOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = Math.round((value * 100) / total);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        }
      }
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Análise de Leads</h3>
          <Tabs defaultValue="status" value={chartType} onValueChange={setChartType as any}>
            <TabsList>
              <TabsTrigger value="status">Status</TabsTrigger>
              <TabsTrigger value="origin">Origem</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="h-64">
          {chartType === 'status' ? (
            <Pie data={statusChartData} options={pieOptions} />
          ) : (
            <Bar data={originChartData} options={barOptions} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
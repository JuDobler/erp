import { useState, useEffect } from 'react';
import { Transaction } from '@shared/schema';
import { Line, Bar } from 'react-chartjs-2';
import { format, startOfWeek, startOfMonth, startOfYear, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, addDays, addMonths, subMonths, addWeeks, addYears, subYears } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CURRENCY_FORMATTER } from '@/lib/constants';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

type FinancialChartProps = {
  transactions: Transaction[];
  periodFilter: string;
};

export function FinancialChart({ transactions, periodFilter }: FinancialChartProps) {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  
  const getDateRangeByPeriod = (periodFilter: string) => {
    const today = new Date();
    let startDate;
    let dateFormat;
    let interval;
    
    if (periodFilter === 'week') {
      startDate = startOfWeek(today, { weekStartsOn: 1 });
      dateFormat = 'EEE';
      interval = eachDayOfInterval({ start: startDate, end: addDays(startDate, 6) });
    } else if (periodFilter === 'month') {
      startDate = startOfMonth(today);
      dateFormat = 'dd';
      interval = eachDayOfInterval({ start: startDate, end: addDays(startDate, 30) });
    } else if (periodFilter === 'year') {
      startDate = startOfYear(today);
      dateFormat = 'MMM';
      interval = eachMonthOfInterval({ start: startDate, end: addMonths(startDate, 11) });
    } else { // 'all'
      startDate = subMonths(today, 11);
      dateFormat = 'MMM yy';
      interval = eachMonthOfInterval({ start: startDate, end: today });
    }
    
    return { startDate, dateFormat, interval };
  };
  
  const prepareChartData = () => {
    const { dateFormat, interval } = getDateRangeByPeriod(periodFilter);
    
    // Create labels based on interval
    const labels = interval.map(date => format(date, dateFormat, { locale: ptBR }));
    
    // Initialize data arrays with zeros
    const revenueData = new Array(labels.length).fill(0);
    const expenseData = new Array(labels.length).fill(0);
    
    // Aggregate transaction data
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      const amount = Number(transaction.amount);
      
      // Find the index where this transaction should be counted
      let index = -1;
      if (periodFilter === 'week' || periodFilter === 'month') {
        const dayIndex = interval.findIndex(date => 
          date.getDate() === transactionDate.getDate() && 
          date.getMonth() === transactionDate.getMonth()
        );
        if (dayIndex !== -1) index = dayIndex;
      } else {
        const monthIndex = interval.findIndex(date => 
          date.getMonth() === transactionDate.getMonth() &&
          date.getFullYear() === transactionDate.getFullYear()
        );
        if (monthIndex !== -1) index = monthIndex;
      }
      
      if (index !== -1) {
        if (transaction.type === 'receita') {
          revenueData[index] += amount;
        } else {
          expenseData[index] += amount;
        }
      }
    });
    
    // Calculate balance (revenue - expense)
    const balanceData = revenueData.map((revenue, i) => revenue - expenseData[i]);
    
    return {
      labels,
      datasets: [
        {
          label: 'Receitas',
          data: revenueData,
          borderColor: 'rgba(34, 197, 94, 1)',
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Despesas',
          data: expenseData,
          borderColor: 'rgba(239, 68, 68, 1)',
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Saldo',
          data: balanceData,
          borderColor: 'rgba(59, 130, 246, 1)',
          backgroundColor: 'rgba(59, 130, 246, 0.2)',
          tension: 0.3,
          fill: true,
          hidden: true,
        },
      ],
    };
  };
  
  const chartData = prepareChartData();
  
  const chartOptions: ChartOptions<'line' | 'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += CURRENCY_FORMATTER.format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value) {
            return CURRENCY_FORMATTER.format(Number(value));
          }
        }
      }
    }
  };
  
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-4 flex justify-between items-center">
          <h3 className="text-lg font-medium">Análise Financeira</h3>
          <Tabs defaultValue="line" value={chartType} onValueChange={setChartType as any}>
            <TabsList>
              <TabsTrigger value="line">Linha</TabsTrigger>
              <TabsTrigger value="bar">Barra</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="h-64">
          {chartType === 'line' ? (
            <Line data={chartData} options={chartOptions} />
          ) : (
            <Bar data={chartData} options={chartOptions} />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
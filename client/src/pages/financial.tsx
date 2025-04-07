import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { TransactionForm } from "@/components/financial/transaction-form";
import { TransactionTable } from "@/components/financial/transaction-table";
import { FinancialChart } from "@/components/charts/financial-chart";
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
import { Plus, Search, Filter, DollarSign, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CURRENCY_FORMATTER } from "@/lib/constants";
import { Skeleton } from "@/components/ui/skeleton";

export default function Financial() {
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [periodFilter, setPeriodFilter] = useState("month");
  const [paidFilter, setPaidFilter] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: transactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ['/api/transactions'],
  });

  const filteredTransactions = transactions?.filter((transaction: Transaction) => {
    if (searchTerm && !transaction.description.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (typeFilter && typeFilter !== "todos" && transaction.type !== typeFilter) {
      return false;
    }
    if (paidFilter && paidFilter !== "todos") {
      const isPaid = paidFilter === "paid";
      if (transaction.paid !== isPaid) {
        return false;
      }
    }
    
    // Period filtering
    const txDate = new Date(transaction.date);
    const now = new Date();
    
    if (periodFilter === "month") {
      if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
        return false;
      }
    } else if (periodFilter === "year") {
      if (txDate.getFullYear() !== now.getFullYear()) {
        return false;
      }
    } else if (periodFilter === "week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      if (txDate < oneWeekAgo) {
        return false;
      }
    }
    
    return true;
  });

  const revenue = filteredTransactions
    ?.filter((tx: Transaction) => tx.type === 'receita')
    .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0) || 0;
    
  const expenses = filteredTransactions
    ?.filter((tx: Transaction) => tx.type === 'despesa')
    .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0) || 0;
    
  const balance = revenue - expenses;
  
  const pendingRevenue = filteredTransactions
    ?.filter((tx: Transaction) => tx.type === 'receita' && !tx.paid)
    .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0) || 0;
    
  const pendingExpenses = filteredTransactions
    ?.filter((tx: Transaction) => tx.type === 'despesa' && !tx.paid)
    .reduce((sum: number, tx: Transaction) => sum + Number(tx.amount), 0) || 0;

  const revenueTransactions = filteredTransactions?.filter((tx: Transaction) => tx.type === 'receita') || [];
  const expenseTransactions = filteredTransactions?.filter((tx: Transaction) => tx.type === 'despesa') || [];
  const pendingTransactions = filteredTransactions?.filter((tx: Transaction) => !tx.paid) || [];
  const paidTransactions = filteredTransactions?.filter((tx: Transaction) => tx.paid) || [];
  
  const currentPeriodText = periodFilter === 'month' 
    ? format(new Date(), "'Mês de' MMMM 'de' yyyy", { locale: ptBR })
    : periodFilter === 'year' 
      ? format(new Date(), "'Ano de' yyyy", { locale: ptBR })
      : periodFilter === 'week'
        ? 'Últimos 7 dias'
        : 'Todo período';

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <Card className="bg-green-50 border-green-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Receitas</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{CURRENCY_FORMATTER.format(revenue)}</p>
                )}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">{currentPeriodText}</div>
          </CardContent>
        </Card>

        {/* Expenses Card */}
        <Card className="bg-red-50 border-red-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Despesas</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">{CURRENCY_FORMATTER.format(expenses)}</p>
                )}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">{currentPeriodText}</div>
          </CardContent>
        </Card>

        {/* Balance Card */}
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Saldo</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className={`text-2xl font-semibold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {CURRENCY_FORMATTER.format(balance)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">{currentPeriodText}</div>
          </CardContent>
        </Card>

        {/* Pending Card */}
        <Card className="bg-yellow-50 border-yellow-100">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <div className="bg-yellow-100 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-sm font-medium text-gray-500">Pendentes</h3>
                {isLoading ? (
                  <Skeleton className="h-8 w-24 mt-1" />
                ) : (
                  <p className="text-2xl font-semibold text-gray-800">
                    {CURRENCY_FORMATTER.format(pendingRevenue - pendingExpenses)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-500">
              <span className="text-green-600">{CURRENCY_FORMATTER.format(pendingRevenue)}</span> a receber / 
              <span className="text-red-600"> {CURRENCY_FORMATTER.format(pendingExpenses)}</span> a pagar
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg font-medium">Gestão Financeira</CardTitle>
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
            <Button 
              onClick={() => setIsAddingTransaction(true)}
              className="bg-black hover:bg-gray-900 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Transação
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex-grow md:flex-grow-0 relative">
              <Input
                placeholder="Buscar transações..."
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
                value={typeFilter}
                onValueChange={setTypeFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos tipos</SelectItem>
                  <SelectItem value="receita">Receitas</SelectItem>
                  <SelectItem value="despesa">Despesas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Select
                value={paidFilter}
                onValueChange={setPaidFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Todos status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos status</SelectItem>
                  <SelectItem value="paid">Pagos</SelectItem>
                  <SelectItem value="pending">Pendentes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-8">
            <FinancialChart 
              transactions={filteredTransactions || []} 
              periodFilter={periodFilter}
            />
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mt-6">
            <TabsList className="mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="revenue">Receitas</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="paid">Pagas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="mt-0">
              <TransactionTable 
                transactions={filteredTransactions || []} 
                isLoading={isLoading} 
              />
            </TabsContent>
            
            <TabsContent value="revenue" className="mt-0">
              <TransactionTable 
                transactions={revenueTransactions} 
                isLoading={isLoading} 
              />
            </TabsContent>
            
            <TabsContent value="expenses" className="mt-0">
              <TransactionTable 
                transactions={expenseTransactions} 
                isLoading={isLoading} 
              />
            </TabsContent>
            
            <TabsContent value="pending" className="mt-0">
              <TransactionTable 
                transactions={pendingTransactions} 
                isLoading={isLoading} 
              />
            </TabsContent>
            
            <TabsContent value="paid" className="mt-0">
              <TransactionTable 
                transactions={paidTransactions} 
                isLoading={isLoading} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Transaction Dialog */}
      <TransactionForm
        open={isAddingTransaction}
        onOpenChange={(open) => setIsAddingTransaction(open)}
      />
    </div>
  );
}

import { useMutation } from "@tanstack/react-query";
import { Transaction } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { TransactionForm } from "./transaction-form";

import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowDownCircle, ArrowUpCircle, DollarSign, Edit, Trash2 } from "lucide-react";
import { CURRENCY_FORMATTER, DATE_FORMATTER } from "@/lib/constants";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type TransactionTableProps = {
  transactions: Transaction[];
  isLoading?: boolean;
};

export function TransactionTable({ transactions, isLoading = false }: TransactionTableProps) {
  const { toast } = useToast();
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const togglePaidMutation = useMutation({
    mutationFn: async ({ id, paid }: { id: number; paid: boolean }) => {
      const response = await apiRequest('PATCH', `/api/transactions/${id}`, { paid });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Status atualizado",
        description: "O status da transação foi atualizado com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao atualizar o status da transação.",
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/transactions/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transação excluída",
        description: "A transação foi excluída com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions'] });
      setIsDeleting(false);
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir a transação.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array(5).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <DollarSign className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhuma transação encontrada</h3>
        <p className="text-gray-500">Não há transações que correspondam aos filtros selecionados.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell className="font-medium">{transaction.description}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {transaction.type === 'receita' ? (
                      <>
                        <ArrowUpCircle className="mr-2 h-4 w-4 text-green-500" />
                        <span>Receita</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle className="mr-2 h-4 w-4 text-red-500" />
                        <span>Despesa</span>
                      </>
                    )}
                  </div>
                </TableCell>
                <TableCell className={transaction.type === 'receita' ? 'text-green-600' : 'text-red-600'}>
                  {CURRENCY_FORMATTER.format(Number(transaction.amount))}
                </TableCell>
                <TableCell>
                  {transaction.date && DATE_FORMATTER.format(new Date(transaction.date))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      checked={transaction.paid}
                      onCheckedChange={(checked) => {
                        togglePaidMutation.mutate({ id: transaction.id, paid: !!checked });
                      }}
                      disabled={togglePaidMutation.isPending}
                    />
                    <span>{transaction.paid ? 'Pago' : 'Pendente'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsEditing(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Editar</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setIsDeleting(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                      <span className="sr-only">Excluir</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Transaction Dialog */}
      <TransactionForm
        open={isEditing}
        onOpenChange={(open) => {
          setIsEditing(open);
          if (!open) setSelectedTransaction(null);
        }}
        transaction={selectedTransaction}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir esta transação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedTransaction && deleteTransactionMutation.mutate(selectedTransaction.id)}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteTransactionMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
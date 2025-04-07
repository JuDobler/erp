import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  Settings as SettingsIcon, 
  Database, 
  Plus,
  UserPlus,
  Trash2,
  Edit,
  Download
} from "lucide-react";

import { UserForm } from "@/components/settings/user-form";
import { BackupControls } from "@/components/settings/backup-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthContext } from "@/lib/auth";
import { User, userRoleLabels } from "@shared/schema";
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
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { user: currentUser, isAdmin } = useAuthContext();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("users");
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { data: users, isLoading: isUsersLoading } = useQuery({
    queryKey: ['/api/users'],
    enabled: !!currentUser && isAdmin(),
  });

  const { data: backups, isLoading: isBackupsLoading } = useQuery({
    queryKey: ['/api/backups'],
    enabled: !!currentUser && isAdmin(),
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`, undefined);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Usuário excluído",
        description: "O usuário foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setUserToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message || "Ocorreu um erro ao excluir o usuário.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteUser = () => {
    if (userToDelete) {
      deleteUserMutation.mutate(userToDelete.id);
    }
  };

  if (!currentUser || !isAdmin()) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <SettingsIcon className="h-12 w-12 text-gray-300 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">Acesso Restrito</h3>
        <p className="text-gray-500 mb-4">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">Configurações do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="users" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-2" />
                Usuários
              </TabsTrigger>
              <TabsTrigger value="backup">
                <Database className="h-4 w-4 mr-2" />
                Backup
              </TabsTrigger>
            </TabsList>
            
            {/* Users Management Tab */}
            <TabsContent value="users" className="mt-0">
              <div className="flex justify-end mb-6">
                <Button 
                  onClick={() => {
                    setEditingUser(null);
                    setIsAddingUser(true);
                  }}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Novo Usuário
                </Button>
              </div>
              
              {isUsersLoading ? (
                <div className="space-y-4">
                  {Array(5).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : users?.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user: User) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">{user.name}</TableCell>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{userRoleLabels[user.role]}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingUser(user);
                                  setIsAddingUser(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Editar</span>
                              </Button>
                              {user.id !== currentUser.id && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-700"
                                  onClick={() => setUserToDelete(user)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Excluir</span>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum usuário encontrado</h3>
                  <p className="text-gray-500 mb-4">Adicione usuários ao sistema.</p>
                  <Button onClick={() => setIsAddingUser(true)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Novo Usuário
                  </Button>
                </div>
              )}

              {/* User Form Dialog */}
              <UserForm
                open={isAddingUser}
                onOpenChange={(open) => {
                  setIsAddingUser(open);
                  if (!open) setEditingUser(null);
                }}
                user={editingUser}
              />

              {/* Delete User Confirmation Dialog */}
              <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir o usuário {userToDelete?.name}? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={handleDeleteUser}
                      disabled={deleteUserMutation.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleteUserMutation.isPending ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </TabsContent>
            
            {/* Backup Tab */}
            <TabsContent value="backup" className="mt-0">
              <BackupControls backups={backups} isLoading={isBackupsLoading} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

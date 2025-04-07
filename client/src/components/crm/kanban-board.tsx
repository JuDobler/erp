import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Lead, ContactHistory } from "@shared/schema";
import { LEAD_STATUSES } from "@/lib/constants";
import { LeadCard } from "./lead-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface KanbanBoardProps {
  leads?: Lead[];
}

export function KanbanBoard({ leads }: KanbanBoardProps) {
  const { toast } = useToast();
  const [groupedLeads, setGroupedLeads] = useState<Record<string, Lead[]>>({});
  const [draggingLeadId, setDraggingLeadId] = useState<number | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<string | null>(null);

  const { isLoading: isLeadsLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
    enabled: !leads, // Only fetch if leads prop is not provided
  });

  const { data: contacts, isLoading: isContactsLoading, refetch: refetchContacts } = useQuery({
    queryKey: ['/api/contacts'],
    enabled: false, // Don't fetch automatically
  });

  const updateLeadStatusMutation = useMutation({
    mutationFn: async ({ leadId, newStatus }: { leadId: number; newStatus: string }) => {
      const response = await apiRequest("PUT", `/api/leads/${leadId}`, {
        status: newStatus,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leads"] });
      toast({
        title: "Status atualizado",
        description: "O status do lead foi atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar status",
        description: error.message || "Ocorreu um erro ao atualizar o status do lead.",
        variant: "destructive",
      });
    },
  });

  // Group leads by status when the data changes
  useEffect(() => {
    if (leads) {
      const grouped: Record<string, Lead[]> = {};
      
      // Initialize all statuses with empty arrays
      LEAD_STATUSES.forEach(status => {
        grouped[status.value] = [];
      });
      
      // Add leads to their respective status groups
      leads.forEach((lead: Lead) => {
        if (grouped[lead.status]) {
          grouped[lead.status].push(lead);
        } else {
          // If status is not in our predefined statuses, put it in 'novo'
          grouped['novo'].push(lead);
        }
      });
      
      setGroupedLeads(grouped);
    }
  }, [leads]);

  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData("text/plain", lead.id.toString());
    setDraggingLeadId(lead.id);
  };

  const handleDragOver = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    setDropTargetStatus(status);
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const leadId = parseInt(e.dataTransfer.getData("text/plain"), 10);
    
    if (isNaN(leadId)) return;
    
    const lead = leads.find((l: Lead) => l.id === leadId);
    if (lead && lead.status !== targetStatus) {
      updateLeadStatusMutation.mutate({ leadId, newStatus: targetStatus });
    }
    
    setDraggingLeadId(null);
    setDropTargetStatus(null);
  };

  const handleDragEnd = () => {
    setDraggingLeadId(null);
    setDropTargetStatus(null);
  };

  if (isLeadsLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 overflow-x-auto">
        {LEAD_STATUSES.map((status) => (
          <div key={status.value} className="bg-gray-100 rounded-lg p-4 min-h-96">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700 flex items-center">
                <span className={`h-2 w-2 ${status.color} rounded-full mr-2`}></span>
                {status.label}
              </h3>
              <Skeleton className="h-6 w-6 rounded" />
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 overflow-x-auto">
      {LEAD_STATUSES.map((status) => (
        <div
          key={status.value}
          className={`bg-gray-100 rounded-lg p-4 kanban-column min-h-96 ${
            dropTargetStatus === status.value ? "bg-gray-200" : ""
          }`}
          onDragOver={(e) => handleDragOver(e, status.value)}
          onDrop={(e) => handleDrop(e, status.value)}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700 flex items-center">
              <span className={`h-2 w-2 ${status.color} rounded-full mr-2`}></span>
              {status.label}
            </h3>
            <span className="bg-gray-200 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {groupedLeads[status.value]?.length || 0}
            </span>
          </div>

          <div className="space-y-3">
            {groupedLeads[status.value]?.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                refetchContacts={refetchContacts}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

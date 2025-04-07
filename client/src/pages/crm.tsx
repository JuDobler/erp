import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lead } from "@shared/schema";
import { LeadForm } from "@/components/crm/lead-form";
import { KanbanBoard } from "@/components/crm/kanban-board";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Plus, Filter } from "lucide-react";
import { LEGAL_AREAS, LEAD_ORIGINS } from "@/lib/constants";

export default function CRM() {
  const [isAddingLead, setIsAddingLead] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [legalAreaFilter, setLegalAreaFilter] = useState("");
  const [originFilter, setOriginFilter] = useState("");

  const { data: leads, isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });
  
  const filteredLeads = leads?.filter((lead: Lead) => {
    if (searchTerm && !lead.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (legalAreaFilter && legalAreaFilter !== "todos" && lead.legalArea !== legalAreaFilter) {
      return false;
    }
    if (originFilter && originFilter !== "todas" && lead.origin !== originFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Gestão de Leads</h2>
          <Button
            onClick={() => setIsAddingLead(true)}
            className="bg-[#1e293b] hover:bg-[#0f172a] text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Lead
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-grow md:flex-grow-0 relative">
            <Input
              placeholder="Buscar leads..."
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
              value={legalAreaFilter}
              onValueChange={setLegalAreaFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos assuntos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos assuntos</SelectItem>
                {LEGAL_AREAS.map((area) => (
                  <SelectItem key={area.value} value={area.value}>
                    {area.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Select
              value={originFilter}
              onValueChange={setOriginFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas origens" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas origens</SelectItem>
                {LEAD_ORIGINS.map((origin) => (
                  <SelectItem key={origin.value} value={origin.value}>
                    {origin.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <KanbanBoard leads={filteredLeads} />

      {/* Add Lead Dialog */}
      <LeadForm
        open={isAddingLead}
        onOpenChange={(open) => setIsAddingLead(open)}
      />
    </div>
  );
}

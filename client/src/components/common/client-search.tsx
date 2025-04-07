import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientSearchProps {
  value: number | undefined;
  onChange: (value: number) => void;
  placeholder?: string;
  buttonClassName?: string;
  required?: boolean;
  isRequired?: boolean;
  disabled?: boolean;
}

export function ClientSearch({ 
  value, 
  onChange, 
  placeholder = "Selecione um cliente...", 
  buttonClassName,
  required = false,
  isRequired = false,
  disabled = false
}: ClientSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const { data: clients, isLoading } = useQuery({
    queryKey: ['/api/clients'],
  });

  const selectedClient = clients?.find((client: any) => client.id === value);

  const filteredClients = searchTerm 
    ? clients?.filter((client: any) => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.phone && client.phone.includes(searchTerm))
      )
    : clients;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", buttonClassName)}
          disabled={disabled}
        >
          <div className="flex items-center gap-2 truncate">
            {value ? (
              <span className="truncate">{selectedClient?.name}</span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput 
            placeholder="Busque pelo nome, email ou telefone..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="h-9" 
          />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-sm">
              {isLoading ? (
                <div className="flex justify-center items-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                "Nenhum cliente encontrado."
              )}
            </CommandEmpty>
            <CommandGroup>
              {filteredClients?.map((client: any) => (
                <CommandItem
                  key={client.id}
                  value={client.id.toString()}
                  onSelect={() => {
                    onChange(client.id);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === client.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <span>{client.name}</span>
                    </div>
                    <div className="ml-6 text-xs text-muted-foreground">
                      {client.phone}
                      {client.email && ` • ${client.email}`}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
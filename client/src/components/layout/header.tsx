import { useState } from "react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/lib/auth";
import { NAV_ITEMS } from "@/lib/constants";
import { Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Header() {
  const [location] = useLocation();
  const { user } = useAuthContext();
  const [isDarkMode, setIsDarkMode] = useState(false);

  if (!user) return null;

  // Find the current page label
  const currentPage = NAV_ITEMS.find((item) => item.href === location)?.label || "Dashboard";

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle("dark");
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <span className="text-lg font-semibold text-gray-800">{currentPage}</span>
        </div>
        <div className="flex items-center space-x-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDarkMode ? "Modo claro" : "Modo escuro"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-500 hover:text-gray-700 relative"
                    >
                      <Bell size={20} />
                      <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Notificações</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">Prazo expirando</span>
                  <span className="text-sm text-gray-500">Tarefa: Enviar proposta</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <div className="flex flex-col">
                  <span className="font-medium">Novo lead</span>
                  <span className="text-sm text-gray-500">Cliente: João Silva</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative">
            <div className="h-8 w-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase() || "U"}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

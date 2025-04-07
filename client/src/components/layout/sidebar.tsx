import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuthContext } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "@/lib/constants";
import { 
  Home, Users, Briefcase, CheckSquare, FileText,
  DollarSign, BarChart2, Settings, LogOut, Menu, Zap
} from "lucide-react";
import logo from "@/assets/logo.png";

type IconType = 'home' | 'users' | 'briefcase' | 'check-square' | 'dollar-sign' | 'bar-chart-2' | 'settings' | 'file-text' | 'zap';

const getIcon = (icon: IconType, className: string) => {
  switch (icon) {
    case 'home':
      return <Home className={className} />;
    case 'users':
      return <Users className={className} />;
    case 'briefcase':
      return <Briefcase className={className} />;
    case 'check-square':
      return <CheckSquare className={className} />;
    case 'dollar-sign':
      return <DollarSign className={className} />;
    case 'bar-chart-2':
      return <BarChart2 className={className} />;
    case 'settings':
      return <Settings className={className} />;
    case 'file-text':
      return <FileText className={className} />;
    case 'zap':
      return <Zap className={className} />;
    default:
      return <Home className={className} />;
  }
};

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuthContext();
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;

  return (
    <aside
      className={`bg-[#1e293b] dark:bg-[#0f172a] flex-shrink-0 transition-all duration-300 ease-in-out overflow-y-auto shadow-lg ${
        isCollapsed ? "w-20" : "w-64"
      }`}
    >
      <div className="p-4 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center">
          <div className={`h-10 ${isCollapsed ? "w-10" : "w-auto"} transition-all duration-300`}>
            <img src={logo} alt="Dobler Advogados" className="h-full object-contain" />
          </div>
          {!isCollapsed && (
            <h1
              className="ml-3 font-semibold text-xl text-white whitespace-nowrap overflow-hidden transition-all duration-300"
            >
              Dobler Advogados
            </h1>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-white hover:bg-gray-700 focus:outline-none"
        >
          <Menu size={20} />
        </Button>
      </div>

      <nav className="mt-5 px-2">
        <div className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <div key={item.href}>
              <Link href={item.href}>
                <div
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-md cursor-pointer ${
                    location === item.href
                      ? "bg-gray-700 text-white"
                      : "text-white hover:bg-gray-700"
                  }`}
                >
                  {getIcon(item.icon as IconType, `h-5 w-5 ${isCollapsed ? "" : "mr-3"}`)}
                  <span
                    className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
                      isCollapsed ? "opacity-0 w-0" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </nav>

      <div className="mt-auto p-4 border-t border-gray-700">
        <div className="flex items-center">
          <div className="h-8 w-8 bg-gray-200 text-gray-800 rounded-full flex items-center justify-center font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div
            className={`ml-3 whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isCollapsed ? "opacity-0 w-0" : ""
            }`}
          >
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-gray-300">{user.role === 'admin' ? 'Administrador' : user.role}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          onClick={() => logout()}
          className={`mt-3 flex items-center w-full px-3 py-2 text-sm rounded-md text-white hover:bg-gray-700 ${
            isCollapsed ? "justify-center" : ""
          }`}
        >
          <LogOut className="h-5 w-5" />
          <span
            className={`ml-2 whitespace-nowrap overflow-hidden transition-all duration-300 ${
              isCollapsed ? "hidden" : ""
            }`}
          >
            Sair
          </span>
        </Button>
      </div>
    </aside>
  );
}

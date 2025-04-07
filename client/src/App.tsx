import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import CRM from "@/pages/crm";
import Cases from "@/pages/cases";
import Tasks from "@/pages/tasks";
import Financial from "@/pages/financial";
import Reports from "@/pages/reports";
import Settings from "@/pages/settings";
import Documents from "@/pages/documents";
import QuickActions from "@/pages/quick-actions";
import Clients from "@/pages/clients";
import { useAuthContext, AuthProvider } from "./lib/auth";
import { Sidebar } from "./components/layout/sidebar";
import { Header } from "./components/layout/header";

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuthContext();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    setLocation("/login");
    return null;
  }

  return <Component {...rest} />;
}

function AppRoutes() {
  const { user } = useAuthContext();
  const [location] = useLocation();

  // If we're at the root path, redirect to /dashboard
  if (location === "/" && user) {
    return <Route path="/" component={() => {
      window.location.href = "/dashboard";
      return null;
    }} />;
  }

  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      {/* Protected routes with layout */}
      <Route path="/dashboard">
        <LayoutWithSidebar>
          <ProtectedRoute component={Dashboard} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/crm">
        <LayoutWithSidebar>
          <ProtectedRoute component={CRM} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/clients">
        <LayoutWithSidebar>
          <ProtectedRoute component={Clients} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/cases">
        <LayoutWithSidebar>
          <ProtectedRoute component={Cases} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/tasks">
        <LayoutWithSidebar>
          <ProtectedRoute component={Tasks} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/financial">
        <LayoutWithSidebar>
          <ProtectedRoute component={Financial} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/reports">
        <LayoutWithSidebar>
          <ProtectedRoute component={Reports} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/settings">
        <LayoutWithSidebar>
          <ProtectedRoute component={Settings} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/documents">
        <LayoutWithSidebar>
          <ProtectedRoute component={Documents} />
        </LayoutWithSidebar>
      </Route>
      
      <Route path="/quick-actions">
        <LayoutWithSidebar>
          <ProtectedRoute component={QuickActions} />
        </LayoutWithSidebar>
      </Route>
      
      {/* Redirect root to dashboard if authenticated */}
      <Route path="/" component={() => {
        if (user) {
          window.location.href = "/dashboard";
          return null;
        }
        window.location.href = "/login";
        return null;
      }} />
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function LayoutWithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-gray-100 p-4">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

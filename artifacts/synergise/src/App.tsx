import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Admin from "@/pages/Admin";
import Onboarding from "@/pages/Onboarding";
import Dashboard from "@/pages/dashboard/Dashboard";
import Modelling from "@/pages/dashboard/Modelling";
import Accounts from "@/pages/dashboard/Accounts";
import Comparables from "@/pages/dashboard/Comparables";
import Settings from "@/pages/dashboard/Settings";
import CfoMetrics from "@/pages/dashboard/CfoMetrics";
import UnitEconomics from "@/pages/dashboard/UnitEconomics";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/admin" component={Admin} />

      {/* Protected Routes */}
      <Route path="/onboarding">
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/modelling">
        <ProtectedRoute>
          <Modelling />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/accounts">
        <ProtectedRoute>
          <Accounts />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/comparables">
        <ProtectedRoute>
          <Comparables />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/cfo-metrics">
        <ProtectedRoute>
          <CfoMetrics />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/unit-economics">
        <ProtectedRoute>
          <UnitEconomics />
        </ProtectedRoute>
      </Route>
      <Route path="/dashboard/settings">
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

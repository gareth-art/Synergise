import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import { RequireAuth } from "@/components/RequireAuth";
import { RequireOnboarding } from "@/components/RequireOnboarding";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      {/* Public — no auth wrapper */}
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/admin" component={Admin} />

      {/* Onboarding — auth required, no onboarding check */}
      <Route path="/onboarding">
        <RequireAuth>
          <Onboarding />
        </RequireAuth>
      </Route>

      {/* Dashboard routes — auth + onboarding required */}
      <Route path="/dashboard">
        <RequireAuth><RequireOnboarding><Dashboard /></RequireOnboarding></RequireAuth>
      </Route>
      <Route path="/dashboard/modelling">
        <RequireAuth><RequireOnboarding><Modelling /></RequireOnboarding></RequireAuth>
      </Route>
      <Route path="/dashboard/accounts">
        <RequireAuth><RequireOnboarding><Accounts /></RequireOnboarding></RequireAuth>
      </Route>
      <Route path="/dashboard/comparables">
        <RequireAuth><RequireOnboarding><Comparables /></RequireOnboarding></RequireAuth>
      </Route>
      <Route path="/dashboard/cfo-metrics">
        <RequireAuth><RequireOnboarding><CfoMetrics /></RequireOnboarding></RequireAuth>
      </Route>
      <Route path="/dashboard/unit-economics">
        <RequireAuth><RequireOnboarding><UnitEconomics /></RequireOnboarding></RequireAuth>
      </Route>
      <Route path="/dashboard/settings">
        <RequireAuth><RequireOnboarding><Settings /></RequireOnboarding></RequireAuth>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

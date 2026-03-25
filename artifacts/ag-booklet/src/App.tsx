import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrderModalProvider } from "@/contexts/OrderModalContext";
import { OrderModal } from "@/components/OrderModal";
import { AppLayout } from "@/components/layout/AppLayout";

// Public Pages
import Home from "@/pages/Home";
import Requirements from "@/pages/Requirements";
import Services from "@/pages/Services";
import Order from "@/pages/Order";
import Contact from "@/pages/Contact";
import Templates from "@/pages/Templates";
import News from "@/pages/News";
import NewsArticle from "@/pages/NewsArticle";
import NotFound from "@/pages/not-found";
import Privacy from "@/pages/Privacy";

// Admin System
import { AdminGuard } from "@/components/admin/AdminGuard";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminClients from "@/pages/admin/AdminClients";
import AdminNews from "@/pages/admin/AdminNews";
import AdminNewsForm from "@/pages/admin/AdminNewsForm";
import AdminTemplates from "@/pages/admin/AdminTemplates";
import AdminTemplateForm from "@/pages/admin/AdminTemplateForm";
import AdminServices from "@/pages/admin/AdminServices";
import AdminServiceForm from "@/pages/admin/AdminServiceForm";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminFaq from "@/pages/admin/AdminFaq";
import AdminReviews from "@/pages/admin/AdminReviews";
import AdminContracts from "@/pages/admin/AdminContracts";

function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Admin routes — own layout, no AppLayout */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/admin/dashboard">
        {() => <AdminGuard><AdminDashboard /></AdminGuard>}
      </Route>
      <Route path="/admin/clients">
        {() => <AdminGuard><AdminClients /></AdminGuard>}
      </Route>
      <Route path="/admin/orders">
        <Redirect to="/admin/clients" />
      </Route>
      <Route path="/admin/contacts">
        <Redirect to="/admin/clients" />
      </Route>
      <Route path="/admin/news/new">
        {() => <AdminGuard><AdminNewsForm /></AdminGuard>}
      </Route>
      <Route path="/admin/news/:id/edit">
        {() => <AdminGuard><AdminNewsForm /></AdminGuard>}
      </Route>
      <Route path="/admin/news">
        {() => <AdminGuard><AdminNews /></AdminGuard>}
      </Route>
      <Route path="/admin/templates/new">
        {() => <AdminGuard><AdminTemplateForm /></AdminGuard>}
      </Route>
      <Route path="/admin/templates/:id/edit">
        {() => <AdminGuard><AdminTemplateForm /></AdminGuard>}
      </Route>
      <Route path="/admin/templates">
        {() => <AdminGuard><AdminTemplates /></AdminGuard>}
      </Route>
      <Route path="/admin/services/new">
        {() => <AdminGuard><AdminServiceForm /></AdminGuard>}
      </Route>
      <Route path="/admin/services/:id/edit">
        {() => <AdminGuard><AdminServiceForm /></AdminGuard>}
      </Route>
      <Route path="/admin/services">
        {() => <AdminGuard><AdminServices /></AdminGuard>}
      </Route>
      <Route path="/admin/settings">
        {() => <AdminGuard><AdminSettings /></AdminGuard>}
      </Route>
      <Route path="/admin/faq">
        {() => <AdminGuard><AdminFaq /></AdminGuard>}
      </Route>
      <Route path="/admin/reviews">
        {() => <AdminGuard><AdminReviews /></AdminGuard>}
      </Route>
      <Route path="/admin/proposals">
        <Redirect to="/admin/clients" />
      </Route>
      <Route path="/admin/contracts">
        {() => <AdminGuard><AdminContracts /></AdminGuard>}
      </Route>

      {/* Public routes — all share ONE persistent AppLayout */}
      <Route>
        {() => (
          <AppLayout>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/requirements" component={Requirements} />
              <Route path="/services" component={Services} />
              <Route path="/order" component={Order} />
              <Route path="/contact" component={Contact} />
              <Route path="/templates" component={Templates} />
              <Route path="/news/:id" component={NewsArticle} />
              <Route path="/news" component={News} />
              <Route path="/privacy" component={Privacy} />
              <Route component={NotFound} />
            </Switch>
          </AppLayout>
        )}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OrderModalProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <ScrollToTop />
            <Router />
          </WouterRouter>
          <OrderModal />
          <Toaster />
        </OrderModalProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

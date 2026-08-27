
import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster"

import { AuthProvider } from "@/hooks/useAuth";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import LiveDashboard from "@/pages/LiveDashboard";
import Customers from "@/pages/Customers";
import Sales from "@/pages/Sales";
import Products from "@/pages/Products";
import PaymentGateways from "@/pages/PaymentGateways";
import Leads from "@/pages/Leads";
import Marketing from "@/pages/Marketing";
import Reviews from "@/pages/Reviews";
import LinkTempahan from "@/pages/LinkTempahan";
import Coupons from "@/pages/Coupons";
import NotFound from "@/pages/NotFound";
import SalePageView from "@/pages/SalePageView";
import SalePagesFeed from "@/pages/SalePagesFeed";
import SalePagesAdmin from "@/pages/SalePagesAdmin";
import { MainLayout } from "@/components/layout/MainLayout";
import { Sidebar } from "@/components/layout/Sidebar";

import { CustomerReceipt } from "@/components/customers/CustomerReceipt";
import { CustomerInvoice } from "@/components/customers/CustomerInvoice";
import Order from "@/pages/Order";
import Testimoni from "@/pages/Testimoni";
import OrderFullsilk from "@/pages/OrderFullsilk";
import OrderThankYou from "@/pages/OrderThankYou";
import RaceDashboard from "@/pages/RaceDashboard";
import { initPixels, trackPageView } from "@/lib/pixels";

const CRM_PREFIXES = ["/dashboard","/live-dashboard","/leads","/marketing","/customers","/sales","/products","/payment-gateways","/reviews","/coupons","/link-tempahan","/admin","/login"];

function PixelTracker() {
  const { pathname } = useLocation();
  useEffect(() => {
    const isCrm = CRM_PREFIXES.some((p) => pathname.startsWith(p));
    if (isCrm) return;
    let cancelled = false;
    initPixels().then(() => {
      if (!cancelled) trackPageView(pathname);
    });
    return () => { cancelled = true; };
  }, [pathname]);
  return null;
}
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);
  return null;
}

function App() {
  const queryClient = new QueryClient();

  return (
    <AuthProvider>
      <LanguageProvider>
        <QueryClientProvider client={queryClient}>
          <Router>
            <ScrollToTop />
            <PixelTracker />
            <div className="flex min-h-screen w-full">
              <Routes>
                {/* Routes without sidebar */}
                <Route path="/" element={<Index />} />
                <Route path="/admin" element={<Login />} />
                <Route path="/login" element={<Login />} />
                <Route path="/order" element={<Order />} />
                <Route path="/order/:material" element={<Order />} />
                <Route path="/testimoni" element={<Testimoni />} />
                <Route path="/testimoni/:brand" element={<Testimoni />} />
                <Route path="/feed" element={<SalePagesFeed />} />
                <Route path="/feed/:slug" element={<SalePageView />} />
                <Route path="/order-fullsilk" element={<OrderFullsilk />} />
                <Route path="/order/thank-you" element={<OrderThankYou />} />
                <Route path="/live-dashboardacs" element={<RaceDashboard />} />

                {/* Routes with sidebar and authenticated layout */}
                <Route path="/" element={
                  <div className="flex w-full">
                    <Sidebar />
                    <MainLayout />
                  </div>
                }>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/live-dashboard" element={<LiveDashboard />} />
                  <Route path="/leads" element={<Leads />} />
                  <Route path="/marketing" element={<Marketing />} />
                  <Route path="/customers" element={<Customers />} />
                  <Route path="/customers/receipt" element={<CustomerReceipt />} />
                  <Route path="/customers/invoice" element={<CustomerInvoice />} />
                  <Route path="/sales" element={<Sales />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/payment-gateways" element={<PaymentGateways />} />
                  <Route path="/reviews" element={<Reviews />} />
                  <Route path="/coupons" element={<Coupons />} />
                  <Route path="/link-tempahan" element={<LinkTempahan />} />
                  <Route path="/sale-pages" element={<SalePagesAdmin />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Toaster />
          </Router>
        </QueryClientProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;


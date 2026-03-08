
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster"

import { AuthProvider } from "@/hooks/useAuth";
import Index from "@/pages/Index";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import Sales from "@/pages/Sales";
import Products from "@/pages/Products";
import Leads from "@/pages/Leads";
import Marketing from "@/pages/Marketing";
import NotFound from "@/pages/NotFound";
import { MainLayout } from "@/components/layout/MainLayout";
import { Sidebar } from "@/components/layout/Sidebar";

import { CustomerReceipt } from "@/components/customers/CustomerReceipt";
import { CustomerInvoice } from "@/components/customers/CustomerInvoice";
import Order from "@/pages/Order";
import OrderThankYou from "@/pages/OrderThankYou";

function App() {
  const queryClient = new QueryClient();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="flex min-h-screen w-full">
            <Routes>
              {/* Routes without sidebar */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/order" element={<Order />} />
              <Route path="/order/thank-you" element={<OrderThankYou />} />
              
              {/* Routes with sidebar and authenticated layout */}
              <Route path="/" element={
                <div className="flex w-full">
                  <Sidebar />
                  <MainLayout />
                </div>
              }>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<Leads />} />
                <Route path="/marketing" element={<Marketing />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/receipt" element={<CustomerReceipt />} />
                <Route path="/customers/invoice" element={<CustomerInvoice />} />
                <Route path="/sales" element={<Sales />} />
                <Route path="/products" element={<Products />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;


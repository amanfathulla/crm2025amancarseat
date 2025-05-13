
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
import NotFound from "@/pages/NotFound";
import { MainLayout } from "@/components/layout/MainLayout";
import { Sidebar } from "@/components/layout/Sidebar";

import { CustomerReceipt } from "@/components/customers/CustomerReceipt";

function App() {
  const queryClient = new QueryClient();

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="flex min-h-screen w-full">
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              
              {/* Routes that require authentication and sidebar */}
              <Route path="/" element={<>
                <Sidebar />
                <MainLayout />
              </>}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/customers" element={<Customers />} />
                <Route path="/customers/receipt" element={<CustomerReceipt />} />
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

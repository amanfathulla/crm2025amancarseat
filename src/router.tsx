
import { createBrowserRouter } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Index from "./pages/Index";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import Sales from "./pages/Sales";
import Customers from "./pages/Customers";
import Marketing from "./pages/Marketing";
import { MainLayout } from "./components/layout/MainLayout";
import { Outlet } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout><Outlet /></MainLayout>,
    children: [
      {
        index: true,
        element: <Index />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "products",
        element: <Products />,
      },
      {
        path: "sales",
        element: <Sales />,
      },
      {
        path: "customers",
        element: <Customers />,
      },
      {
        path: "marketing",
        element: <Marketing />,
      },
    ],
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

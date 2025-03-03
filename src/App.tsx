import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { cn } from "./lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-react-theme">
      <RouterProvider router={router} />
      <Toaster />
    </ThemeProvider>
  );
}

export default App;

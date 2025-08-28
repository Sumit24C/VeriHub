import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useState } from "react";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Results from "./pages/Results";
import Verification from "./pages/Verification";

const queryClient = new QueryClient();

const ProgressOverlay = () => {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      // Open overlay on first progress event
      if (!open) setOpen(true);
      const text = detail.text || "";
      if (Array.isArray(text)) {
        setLines((prev) => [...prev, ...text.map((t) => ({ id: Date.now() + Math.random(), t }))].slice(-20));
      } else if (text) {
        setLines((prev) => [...prev, { id: Date.now(), t: text }].slice(-20));
      }
      if (detail.stage === "success" || detail.stage === "error" || detail.stage === "complete") {
        // small delay so users can see the last line
        setTimeout(() => { setOpen(false); setLines([]); }, 600);
      }
    };
    window.addEventListener("verihub:progress", handler);
    return () => window.removeEventListener("verihub:progress", handler);
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 backdrop-blur-sm bg-background/60" />
      <div className="relative z-[61] w-full max-w-md rounded-xl bg-background/95 border p-5 shadow-lg">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <div className="text-sm font-medium">Verifying...</div>
        </div>
        <div className="h-48 overflow-auto rounded-md bg-muted/40 p-3 text-xs space-y-1">
          {lines.map((l) => (
            <div key={l.id} className="animate-slide-up">{l.t}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="verihub-ui-theme">
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/verification" element={<Navigate to="/" replace />} />
            <Route path="/results" element={<Results />} />
            <Route path="/results/:chatId" element={<Results />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <ProgressOverlay />
        </BrowserRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;

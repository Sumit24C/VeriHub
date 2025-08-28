import Header from "@/components/Header";
import ChatInterface from "@/components/ChatInterface";
import ChatSidebar from "@/components/ChatSidebar";
import React, { useEffect, useState } from "react";

export default function Index() {
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      if (!e?.detail?.text) return;
      setProgress((prev) => [...prev, { id: Date.now(), ...e.detail }].slice(-5));
    };
    window.addEventListener('verihub:progress', handler);
    return () => window.removeEventListener('verihub:progress', handler);
  }, []);
  return (
    <div className="h-screen flex flex-col">
      <Header />
      <div className="flex-1 flex relative">
        <ChatSidebar />
        <div className="flex-1">
          <ChatInterface />
        </div>
        {/* Floating verifying log */}
        {progress.length > 0 && (
          <div className="absolute bottom-6 right-6 w-80 space-y-2">
            {progress.map((p) => (
              <div key={p.id} className={`text-xs px-3 py-2 rounded-md shadow-sm animate-slide-up ${p.stage === 'error' ? 'bg-destructive/15 text-destructive' : p.stage === 'success' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted/80 text-foreground'}`}>
                {p.text}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
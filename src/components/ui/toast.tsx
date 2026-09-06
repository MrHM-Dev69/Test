"use client";

import * as React from "react";
import * as RadixToast from "@radix-ui/react-toast";
import { cn } from "@/lib/utils";

interface ToastMessage {
  id: number;
  title: string;
  description?: string;
  variant?: "default" | "destructive" | "success";
}

interface ToastContextValue {
  toast: (msg: Omit<ToastMessage, "id">) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = React.useState<ToastMessage[]>([]);

  const toast = React.useCallback((msg: Omit<ToastMessage, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: Date.now() + Math.random() }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      <RadixToast.Provider swipeDirection="up">
        {children}
        {messages.map((m) => (
          <RadixToast.Root
            key={m.id}
            duration={4000}
            onOpenChange={(open) => {
              if (!open) setMessages((prev) => prev.filter((x) => x.id !== m.id));
            }}
            className={cn(
              "glass-surface pointer-events-auto rounded-lg p-4 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out",
              m.variant === "destructive" && "border-red-500/40",
              m.variant === "success" && "border-emerald-500/40",
            )}
          >
            <RadixToast.Title className="text-sm font-semibold text-foreground">
              {m.title}
            </RadixToast.Title>
            {m.description && (
              <RadixToast.Description className="mt-1 text-xs text-muted">
                {m.description}
              </RadixToast.Description>
            )}
          </RadixToast.Root>
        ))}
        <RadixToast.Viewport className="fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 p-4" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { Ticket, TicketMessage, User } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

const STATUS_LABELS: Record<string, string> = {
  OPEN: "باز",
  IN_PROGRESS: "در حال بررسی",
  WAITING_FOR_CUSTOMER: "منتظر مشتری",
  RESOLVED: "حل شده",
  CLOSED: "بسته شده",
};

const STATUS_VALUES = ["OPEN", "IN_PROGRESS", "WAITING_FOR_CUSTOMER", "RESOLVED", "CLOSED"] as const;

type TicketWithMessages = Ticket & { user: User; messages: (TicketMessage & { user: User })[] };

export function TicketThread({ ticket }: { ticket: TicketWithMessages }) {
  const router = useRouter();
  const { toast } = useToast();
  const [reply, setReply] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function sendReply() {
    if (!reply.trim()) return;
    setBusy(true);
    try {
      const res = await csrfFetch(`/api/admin/communication/tickets/${ticket.id}/reply`, {
        method: "POST",
        body: JSON.stringify({ message: reply }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا");
      setReply("");
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function changeStatus(status: string) {
    setBusy(true);
    try {
      await csrfFetch(`/api/admin/communication/tickets/${ticket.id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-muted">{ticket.user.name ?? ticket.user.email ?? "—"}</p>
        </div>
        <Badge>{STATUS_LABELS[ticket.status] ?? ticket.status}</Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_VALUES.map((s) => (
          <Button key={s} size="sm" variant={ticket.status === s ? "default" : "outline"} disabled={busy} onClick={() => changeStatus(s)}>
            {STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>گفتگو</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex max-h-[28rem] flex-col gap-2 overflow-y-auto">
            {ticket.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.isFromAdmin ? "self-start bg-accent-muted text-foreground" : "self-end bg-white/5 text-foreground"
                }`}
              >
                <p className="text-xs text-muted">{m.user.name ?? m.user.email ?? "—"}</p>
                <p className="whitespace-pre-wrap">{m.message}</p>
              </div>
            ))}
            {ticket.messages.length === 0 && <p className="text-sm text-muted">پیامی ثبت نشده است.</p>}
          </div>
          <div className="flex gap-2">
            <Textarea placeholder="پاسخ به کاربر..." value={reply} onChange={(e) => setReply(e.target.value)} />
            <Button disabled={busy} onClick={sendReply}>
              ارسال
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

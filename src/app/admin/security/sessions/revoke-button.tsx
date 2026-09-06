"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

export function RevokeSessionButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function revoke() {
    setBusy(true);
    try {
      const res = await csrfFetch(`/api/admin/security/sessions/${sessionId}/revoke`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "خطا");
      toast({ title: "نشست لغو شد", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size="sm" variant="destructive" disabled={busy} onClick={revoke}>
      لغو نشست
    </Button>
  );
}

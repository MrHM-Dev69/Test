"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

const ROLE_OPTIONS = [
  "CUSTOMER",
  "SUPPORT",
  "EDITOR",
  "ACCOUNTANT",
  "SHOP_MANAGER",
  "ACADEMY_MANAGER",
  "MANAGER",
  "ADMIN",
  "SUPER_ADMIN",
] as const;

export function CustomerActions({
  customerId,
  isActive,
  currentRole,
}: {
  customerId: string;
  isActive: boolean;
  currentRole: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState<string | null>(null);
  const [role, setRole] = React.useState(currentRole);

  async function run(key: string, url: string, body?: Record<string, unknown>) {
    setBusy(key);
    try {
      const res = await csrfFetch(url, { method: "POST", body: body ? JSON.stringify(body) : undefined });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "خطا در انجام عملیات");
      toast({ title: "انجام شد", variant: "success" });
      router.refresh();
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
      <Button
        size="sm"
        variant={isActive ? "destructive" : "default"}
        disabled={busy !== null}
        onClick={() => run("status", `/api/admin/customers/${customerId}/status`, { isActive: !isActive })}
      >
        {isActive ? "غیرفعال کردن حساب" : "فعال کردن حساب"}
      </Button>

      <Button
        size="sm"
        variant="secondary"
        disabled={busy !== null}
        onClick={() => run("revoke", `/api/admin/customers/${customerId}/revoke-sessions`)}
      >
        خروج اجباری از همه نشست‌ها
      </Button>

      <Button
        size="sm"
        variant="secondary"
        disabled={busy !== null}
        onClick={() => run("lockout", `/api/admin/customers/${customerId}/reset-lockout`)}
      >
        رفع قفل ورود ناموفق
      </Button>

      <div className="flex items-center gap-2">
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-9 rounded-lg border border-border bg-surface px-2 text-sm text-foreground"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null || role === currentRole}
          onClick={() => run("role", `/api/admin/customers/${customerId}/role`, { role })}
        >
          تغییر نقش
        </Button>
      </div>
    </div>
  );
}

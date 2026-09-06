"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type {
  ProjectRequest,
  Milestone,
  ProjectTask,
  ProjectMessage,
  Invoice,
  User,
} from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";
import { formatToman } from "@/lib/utils";

type SerializedInvoice = Omit<Invoice, "amount"> & { amount: number };

type SerializedProject = Omit<ProjectRequest, "quotedPrice"> & {
  quotedPrice: number | null;
  milestones: Milestone[];
  tasks: ProjectTask[];
  messages: ProjectMessage[];
  invoices: SerializedInvoice[];
  user: User | null;
};

const STATUS_FLOW = [
  "NEW",
  "REVIEWING",
  "QUOTED",
  "ACCEPTED",
  "IN_PROGRESS",
  "WAITING_FOR_CLIENT",
  "COMPLETED",
  "DELIVERED",
] as const;

const STATUS_LABELS: Record<string, string> = {
  NEW: "جدید",
  REVIEWING: "در حال بررسی",
  QUOTED: "قیمت‌گذاری شده",
  ACCEPTED: "پذیرفته شده",
  IN_PROGRESS: "در حال انجام",
  WAITING_FOR_CLIENT: "منتظر مشتری",
  COMPLETED: "تکمیل شده",
  DELIVERED: "تحویل شده",
  CANCELLED: "لغو شده",
};

function useMutate() {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function mutate(url: string, method: string, body?: unknown) {
    setBusy(true);
    try {
      const res = await csrfFetch(url, { method, body: body ? JSON.stringify(body) : undefined });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "خطا در انجام عملیات");
      router.refresh();
      return json;
    } catch (err) {
      toast({ title: "خطا", description: err instanceof Error ? err.message : undefined, variant: "destructive" });
      throw err;
    } finally {
      setBusy(false);
    }
  }

  return { mutate, busy };
}

export function ProjectWorkspace({ project }: { project: SerializedProject }) {
  const { mutate, busy } = useMutate();
  const [quotedPrice, setQuotedPrice] = React.useState(project.quotedPrice?.toString() ?? "");
  const [milestoneTitle, setMilestoneTitle] = React.useState("");
  const [taskTitle, setTaskTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const { toast } = useToast();

  async function changeStatus(status: string) {
    await mutate(`/api/admin/projects/${project.id}/status`, "POST", {
      status,
      quotedPrice: quotedPrice ? Number(quotedPrice) : undefined,
    });
    toast({ title: "وضعیت به‌روزرسانی شد", variant: "success" });
  }

  async function addMilestone() {
    if (!milestoneTitle.trim()) return;
    await mutate(`/api/admin/projects/${project.id}/milestones`, "POST", { title: milestoneTitle });
    setMilestoneTitle("");
  }

  async function toggleMilestone(m: Milestone) {
    await mutate(`/api/admin/projects/${project.id}/milestones`, "PATCH", {
      milestoneId: m.id,
      isCompleted: !m.isCompleted,
    });
  }

  async function deleteMilestone(m: Milestone) {
    await mutate(`/api/admin/projects/${project.id}/milestones?milestoneId=${m.id}`, "DELETE");
  }

  async function addTask() {
    if (!taskTitle.trim()) return;
    await mutate(`/api/admin/projects/${project.id}/tasks`, "POST", { title: taskTitle });
    setTaskTitle("");
  }

  async function toggleTask(t: ProjectTask) {
    await mutate(`/api/admin/projects/${project.id}/tasks`, "PATCH", { taskId: t.id, isCompleted: !t.isCompleted });
  }

  async function deleteTask(t: ProjectTask) {
    await mutate(`/api/admin/projects/${project.id}/tasks?taskId=${t.id}`, "DELETE");
  }

  async function sendMessage() {
    if (!message.trim()) return;
    await mutate(`/api/admin/projects/${project.id}/messages`, "POST", { message });
    setMessage("");
  }

  async function createInvoice() {
    await mutate(`/api/admin/projects/${project.id}/invoice`, "POST");
    toast({ title: "فاکتور ایجاد شد", variant: "success" });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{project.contactName}</h1>
          <p className="mt-1 text-sm text-muted">
            {project.contactEmail} · {project.contactPhone ?? "—"}
          </p>
        </div>
        <Badge>{STATUS_LABELS[project.status] ?? project.status}</Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>جزئیات پروژه</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted">نوع پروژه</p>
            <p>{project.projectType}</p>
          </div>
          <div>
            <p className="text-muted">حوزه</p>
            <p>{project.categoryDomain ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted">بودجه</p>
            <p>{project.budgetRange}</p>
          </div>
          <div>
            <p className="text-muted">اولویت</p>
            <p>{project.priority}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted">توضیحات</p>
            <p className="whitespace-pre-wrap">{project.description}</p>
          </div>
          {project.requirements && (
            <div className="md:col-span-2">
              <p className="text-muted">نیازمندی‌ها</p>
              <p className="whitespace-pre-wrap">{project.requirements}</p>
            </div>
          )}
          {project.attachments.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-muted">پیوست‌ها</p>
              <ul className="flex flex-col gap-1">
                {project.attachments.map((a) => (
                  <li key={a}>
                    <a href={`/api/admin/projects/${project.id}/attachments?key=${encodeURIComponent(a)}`} className="text-accent hover:underline">
                      {a.split("/").pop()}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>مسیر وضعیت پروژه</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_FLOW.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={project.status === s ? "default" : "outline"}
                disabled={busy}
                onClick={() => changeStatus(s)}
              >
                {STATUS_LABELS[s]}
              </Button>
            ))}
            <Button size="sm" variant="destructive" disabled={busy} onClick={() => changeStatus("CANCELLED")}>
              لغو پروژه
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="قیمت پیشنهادی (تومان)"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
              className="max-w-xs"
              inputMode="numeric"
            />
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => changeStatus(project.status)}>
              ثبت قیمت
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>نقاط عطف (Milestones)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {project.milestones.map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={m.isCompleted} onChange={() => toggleMilestone(m)} disabled={busy} />
                  <span className={m.isCompleted ? "line-through text-muted" : ""}>{m.title}</span>
                </label>
                <button onClick={() => deleteMilestone(m)} className="text-xs text-muted hover:text-red-400" disabled={busy}>
                  حذف
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="عنوان نقطه عطف جدید" value={milestoneTitle} onChange={(e) => setMilestoneTitle(e.target.value)} />
              <Button size="sm" disabled={busy} onClick={addMilestone}>
                افزودن
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>وظایف (Tasks)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {project.tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={t.isCompleted} onChange={() => toggleTask(t)} disabled={busy} />
                  <span className={t.isCompleted ? "line-through text-muted" : ""}>{t.title}</span>
                </label>
                <button onClick={() => deleteTask(t)} className="text-xs text-muted hover:text-red-400" disabled={busy}>
                  حذف
                </button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input placeholder="عنوان وظیفه جدید" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <Button size="sm" disabled={busy} onClick={addTask}>
                افزودن
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>گفتگو با مشتری</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
            {project.messages.map((m) => (
              <div
                key={m.id}
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  m.isFromAdmin ? "self-start bg-accent-muted text-foreground" : "self-end bg-white/5 text-foreground"
                }`}
              >
                <p className="text-xs text-muted">{m.senderName}</p>
                <p className="whitespace-pre-wrap">{m.message}</p>
              </div>
            ))}
            {project.messages.length === 0 && <p className="text-sm text-muted">پیامی ثبت نشده است.</p>}
          </div>
          <div className="flex gap-2">
            <Textarea placeholder="پاسخ به مشتری..." value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button disabled={busy} onClick={sendMessage}>
              ارسال
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>فاکتورها</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {project.invoices.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2 text-sm">
              <span>{inv.invoiceNumber}</span>
              <span>{formatToman(inv.amount)}</span>
              <Badge variant="secondary">{inv.status}</Badge>
            </div>
          ))}
          <Button
            size="sm"
            variant="secondary"
            disabled={busy || !project.quotedPrice || !project.userId}
            onClick={createInvoice}
          >
            ایجاد فاکتور بر اساس قیمت پیشنهادی
          </Button>
          {!project.userId && <p className="text-xs text-muted">این درخواست به حساب کاربری متصل نیست؛ امکان صدور فاکتور نیست.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

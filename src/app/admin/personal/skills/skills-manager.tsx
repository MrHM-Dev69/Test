"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

type SkillLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";

interface Skill {
  id: string;
  name: string;
  category: string | null;
  level: SkillLevel;
  iconUrl: string | null;
  order: number;
}

interface FormState {
  name: string;
  category: string;
  level: SkillLevel;
  iconUrl: string;
  order: string;
}

const EMPTY_FORM: FormState = { name: "", category: "", level: "INTERMEDIATE", iconUrl: "", order: "0" };
const LEVELS: SkillLevel[] = ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"];
const LEVEL_LABELS: Record<SkillLevel, string> = {
  BEGINNER: "مبتدی",
  INTERMEDIATE: "متوسط",
  ADVANCED: "پیشرفته",
  EXPERT: "متخصص",
};

export function SkillsManager() {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/personal/skills");
    const data = await res.json();
    setSkills(data.skills ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  function startEdit(skill: Skill) {
    setEditingId(skill.id);
    setForm({
      name: skill.name,
      category: skill.category ?? "",
      level: skill.level,
      iconUrl: skill.iconUrl ?? "",
      order: skill.order.toString(),
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        level: form.level,
        iconUrl: form.iconUrl,
        order: Number(form.order) || 0,
      };
      const url = editingId ? `/api/admin/personal/skills/${editingId}` : "/api/admin/personal/skills";
      const res = await csrfFetch(url, { method: editingId ? "PUT" : "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "ذخیره ناموفق بود", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: editingId ? "مهارت به‌روزرسانی شد" : "مهارت اضافه شد", variant: "success" });
      resetForm();
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("آیا از حذف این مهارت مطمئن هستید؟")) return;
    const res = await csrfFetch(`/api/admin/personal/skills/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      toast({ title: "حذف ناموفق بود", description: data.error, variant: "destructive" });
      return;
    }
    toast({ title: "مهارت حذف شد", variant: "success" });
    load();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-semibold">{editingId ? "ویرایش مهارت" : "افزودن مهارت"}</h2>
          <div>
            <Label htmlFor="skill-name">نام</Label>
            <Input id="skill-name" className="mt-1.5" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
          </div>
          <div>
            <Label htmlFor="skill-category">دسته‌بندی</Label>
            <Input id="skill-category" className="mt-1.5" value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} placeholder="فرانت‌اند" />
          </div>
          <div>
            <Label htmlFor="skill-level">سطح</Label>
            <select
              id="skill-level"
              className="mt-1.5 flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
              value={form.level}
              onChange={(e) => setForm((p) => ({ ...p, level: e.target.value as SkillLevel }))}
            >
              {LEVELS.map((level) => (
                <option key={level} value={level}>
                  {LEVEL_LABELS[level]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="skill-icon">آدرس آیکون</Label>
            <Input id="skill-icon" dir="ltr" className="mt-1.5" value={form.iconUrl} onChange={(e) => setForm((p) => ({ ...p, iconUrl: e.target.value }))} />
          </div>
          <div>
            <Label htmlFor="skill-order">ترتیب</Label>
            <Input id="skill-order" type="number" className="mt-1.5" value={form.order} onChange={(e) => setForm((p) => ({ ...p, order: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "در حال ذخیره..." : editingId ? "به‌روزرسانی" : "افزودن"}
            </Button>
            {editingId && (
              <Button type="button" variant="secondary" onClick={resetForm}>
                انصراف
              </Button>
            )}
          </div>
        </form>
      </Card>

      <div className="space-y-3 lg:col-span-2">
        {loading ? (
          <p className="text-muted">در حال بارگذاری...</p>
        ) : skills.length === 0 ? (
          <p className="text-muted">هنوز مهارتی ثبت نشده است.</p>
        ) : (
          skills.map((skill) => (
            <Card key={skill.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-medium">{skill.name}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted">
                  {skill.category && <span>{skill.category}</span>}
                  <Badge variant="secondary">{LEVEL_LABELS[skill.level]}</Badge>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button size="sm" variant="secondary" onClick={() => startEdit(skill)}>
                  ویرایش
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(skill.id)}>
                  حذف
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

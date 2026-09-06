"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { csrfFetch } from "@/lib/security/csrf-client";

interface CategoryOption {
  id: string;
  name: string;
}
interface TagOption {
  id: string;
  name: string;
}
interface FileRow {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: string;
}

export interface ProductFormValues {
  id?: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  domain: string;
  productType: string;
  isFree: boolean;
  price: number;
  salePrice: number | null;
  coverImage: string;
  version: string;
  changelog: string;
  license: string;
  downloadLimit: number | null;
  downloadExpiryDays: number | null;
  requirements: string;
  compatibility: string;
  documentationUrl: string;
  isPublished: boolean;
  isFeatured: boolean;
  tagIds: string[];
}

const DOMAINS = ["WEB", "WORDPRESS", "FIVEM", "VMP", "MTA", "GENERAL"];
const PRODUCT_TYPES = ["FREE_PRODUCT", "PREMIUM_PRODUCT", "SERVICE"];

export function ProductForm({
  initial,
  categories,
  tags,
  initialFiles,
}: {
  initial?: Partial<ProductFormValues>;
  categories: CategoryOption[];
  tags: TagOption[];
  initialFiles?: FileRow[];
}) {
  const [values, setValues] = useState<ProductFormValues>({
    title: initial?.title ?? "",
    slug: initial?.slug ?? "",
    description: initial?.description ?? "",
    shortDescription: initial?.shortDescription ?? "",
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    domain: initial?.domain ?? "GENERAL",
    productType: initial?.productType ?? "FREE_PRODUCT",
    isFree: initial?.isFree ?? true,
    price: initial?.price ?? 0,
    salePrice: initial?.salePrice ?? null,
    coverImage: initial?.coverImage ?? "",
    version: initial?.version ?? "",
    changelog: initial?.changelog ?? "",
    license: initial?.license ?? "",
    downloadLimit: initial?.downloadLimit ?? null,
    downloadExpiryDays: initial?.downloadExpiryDays ?? null,
    requirements: initial?.requirements ?? "",
    compatibility: initial?.compatibility ?? "",
    documentationUrl: initial?.documentationUrl ?? "",
    isPublished: initial?.isPublished ?? false,
    isFeatured: initial?.isFeatured ?? false,
    tagIds: initial?.tagIds ?? [],
  });
  const [files, setFiles] = useState<FileRow[]>(initialFiles ?? []);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...values,
        salePrice: values.salePrice || null,
        downloadLimit: values.downloadLimit || null,
        downloadExpiryDays: values.downloadExpiryDays || null,
        documentationUrl: values.documentationUrl || undefined,
      };
      const url = initial?.id ? `/api/admin/shop/products/${initial.id}` : "/api/admin/shop/products";
      const method = initial?.id ? "PATCH" : "POST";
      const res = await csrfFetch(url, { method, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطا", description: data.error ?? JSON.stringify(data.issues), variant: "destructive" });
        return;
      }
      toast({ title: "ذخیره شد", variant: "success" });
      if (!initial?.id) {
        router.push(`/admin/shop/products/${data.product.id}/edit`);
      } else {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!initial?.id) {
      toast({ title: "ابتدا محصول را ذخیره کنید", variant: "destructive" });
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await csrfFetch(`/api/admin/shop/products/${initial.id}/files`, {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: "خطا در آپلود فایل", description: data.error, variant: "destructive" });
        return;
      }
      setFiles((f) => [data.file, ...f]);
      toast({ title: "فایل آپلود شد", variant: "success" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function handleFileDelete(fileId: string) {
    if (!initial?.id) return;
    const res = await csrfFetch(`/api/admin/shop/products/${initial.id}/files/${fileId}`, { method: "DELETE" });
    if (res.ok) setFiles((f) => f.filter((x) => x.id !== fileId));
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>عنوان</Label>
          <Input value={values.title} onChange={(e) => set("title", e.target.value)} required className="mt-1" />
        </div>
        <div>
          <Label>اسلاگ (انگلیسی)</Label>
          <Input value={values.slug} onChange={(e) => set("slug", e.target.value)} required className="mt-1" />
        </div>
      </div>

      <div>
        <Label>توضیح کوتاه</Label>
        <Input value={values.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} className="mt-1" maxLength={300} />
      </div>

      <div>
        <Label>توضیحات کامل</Label>
        <Textarea value={values.description} onChange={(e) => set("description", e.target.value)} required className="mt-1 min-h-40" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>دسته‌بندی</Label>
          <select
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>حوزه</Label>
          <select
            value={values.domain}
            onChange={(e) => set("domain", e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {DOMAINS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>نوع محصول</Label>
          <select
            value={values.productType}
            onChange={(e) => set("productType", e.target.value)}
            className="mt-1 h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm"
          >
            {PRODUCT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={values.isFree} onChange={(e) => set("isFree", e.target.checked)} />
          محصول رایگان
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={values.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
          منتشرشده
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={values.isFeatured} onChange={(e) => set("isFeatured", e.target.checked)} />
          ویژه (Featured)
        </label>
      </div>

      {!values.isFree && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>قیمت (تومان)</Label>
            <Input
              type="number"
              value={values.price}
              onChange={(e) => set("price", Number(e.target.value))}
              className="mt-1"
            />
          </div>
          <div>
            <Label>قیمت با تخفیف (اختیاری)</Label>
            <Input
              type="number"
              value={values.salePrice ?? ""}
              onChange={(e) => set("salePrice", e.target.value ? Number(e.target.value) : null)}
              className="mt-1"
            />
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>آدرس تصویر کاور</Label>
          <Input value={values.coverImage} onChange={(e) => set("coverImage", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>نسخه</Label>
          <Input value={values.version} onChange={(e) => set("version", e.target.value)} className="mt-1" />
        </div>
      </div>

      <div>
        <Label>تغییرات نسخه (Changelog)</Label>
        <Textarea value={values.changelog} onChange={(e) => set("changelog", e.target.value)} className="mt-1" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>مجوز/لایسنس</Label>
          <Input value={values.license} onChange={(e) => set("license", e.target.value)} className="mt-1" />
        </div>
        <div>
          <Label>آدرس مستندات</Label>
          <Input value={values.documentationUrl} onChange={(e) => set("documentationUrl", e.target.value)} className="mt-1" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label>سقف تعداد دانلود (خالی = نامحدود)</Label>
          <Input
            type="number"
            value={values.downloadLimit ?? ""}
            onChange={(e) => set("downloadLimit", e.target.value ? Number(e.target.value) : null)}
            className="mt-1"
          />
        </div>
        <div>
          <Label>مهلت دانلود (روز، خالی = نامحدود)</Label>
          <Input
            type="number"
            value={values.downloadExpiryDays ?? ""}
            onChange={(e) => set("downloadExpiryDays", e.target.value ? Number(e.target.value) : null)}
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label>پیش‌نیازها</Label>
        <Textarea value={values.requirements} onChange={(e) => set("requirements", e.target.value)} className="mt-1" />
      </div>
      <div>
        <Label>سازگاری</Label>
        <Input value={values.compatibility} onChange={(e) => set("compatibility", e.target.value)} className="mt-1" />
      </div>

      {tags.length > 0 && (
        <div>
          <Label>برچسب‌ها</Label>
          <div className="mt-2 flex flex-wrap gap-3">
            {tags.map((tag) => (
              <label key={tag.id} className="flex items-center gap-1.5 text-sm">
                <input
                  type="checkbox"
                  checked={values.tagIds.includes(tag.id)}
                  onChange={(e) =>
                    set(
                      "tagIds",
                      e.target.checked ? [...values.tagIds, tag.id] : values.tagIds.filter((id) => id !== tag.id),
                    )
                  }
                />
                {tag.name}
              </label>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" disabled={saving} size="lg" className="self-start">
        {saving ? "در حال ذخیره..." : "ذخیره محصول"}
      </Button>

      {initial?.id && (
        <div className="border-t border-border pt-6">
          <Label>فایل‌های محصول (دانلود امن)</Label>
          <input type="file" onChange={handleFileUpload} disabled={uploading} className="mt-2 text-sm" />
          <div className="mt-4 flex flex-col gap-2">
            {files.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-border p-3 text-sm">
                <span>
                  {f.fileName} ({(Number(f.sizeBytes) / 1024 / 1024).toFixed(2)} MB)
                </span>
                <Button type="button" variant="ghost" size="sm" onClick={() => handleFileDelete(f.id)}>
                  حذف
                </Button>
              </div>
            ))}
            {files.length === 0 && <p className="text-sm text-muted">فایلی آپلود نشده است.</p>}
          </div>
        </div>
      )}
    </form>
  );
}

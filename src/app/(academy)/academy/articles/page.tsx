import type { Metadata } from "next";
import { ContentTypeList } from "@/components/academy/content-list";

export const metadata: Metadata = {
  title: "مقالات",
  description: "فهرست مقالات آکادمی.",
};

export default function ArticlesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">مقالات</h1>
      <ContentTypeList type="ARTICLE" emptyLabel="مقاله‌ای ثبت نشده است." />
    </div>
  );
}

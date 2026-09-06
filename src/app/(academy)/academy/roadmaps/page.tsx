import type { Metadata } from "next";
import { ContentTypeList } from "@/components/academy/content-list";

export const metadata: Metadata = {
  title: "نقشه‌راه‌ها",
  description: "نقشه‌راه‌های یادگیری آکادمی.",
};

export default function RoadmapsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">نقشه‌راه‌ها</h1>
      <ContentTypeList type="ROADMAP" emptyLabel="نقشه‌راهی ثبت نشده است." />
    </div>
  );
}

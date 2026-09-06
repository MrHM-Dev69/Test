import type { Metadata } from "next";
import { ContentTypeList } from "@/components/academy/content-list";

export const metadata: Metadata = {
  title: "آموزش‌ها",
  description: "فهرست آموزش‌های گام‌به‌گام آکادمی.",
};

export default function TutorialsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">آموزش‌ها</h1>
      <ContentTypeList type="TUTORIAL" emptyLabel="آموزشی ثبت نشده است." />
    </div>
  );
}

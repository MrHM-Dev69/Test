import type { Metadata } from "next";
import { ContentTypeList } from "@/components/academy/content-list";

export const metadata: Metadata = {
  title: "منابع",
  description: "منابع آموزشی آکادمی.",
};

export default function ResourcesPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-foreground">منابع</h1>
      <ContentTypeList type="RESOURCE" emptyLabel="منبعی ثبت نشده است." />
    </div>
  );
}

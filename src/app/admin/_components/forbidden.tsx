import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Forbidden({ label }: { label?: string }) {
  return (
    <Card className="border-red-500/30">
      <CardHeader>
        <CardTitle>دسترسی غیرمجاز</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted">
        شما به بخش{label ? ` «${label}»` : ""} دسترسی ندارید. برای دریافت دسترسی با مدیر سیستم تماس بگیرید.
      </CardContent>
    </Card>
  );
}

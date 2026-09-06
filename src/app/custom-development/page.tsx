import type { Metadata } from "next";
import { Card, CardTitle } from "@/components/ui/card";
import { ensureCsrfCookie } from "@/lib/security/csrf";
import { CustomDevelopmentForm } from "./request-form";

export const metadata: Metadata = {
  title: "درخواست پروژه سفارشی",
  description: "درخواست توسعه اختصاصی وب، وردپرس، FiveM، VMP و MTA.",
};

export default async function CustomDevelopmentPage() {
  await ensureCsrfCookie();

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-3xl font-bold text-gradient-accent">درخواست پروژه سفارشی</h1>
      <p className="mt-3 text-sm text-muted">
        برای دریافت مشاوره و قیمت پروژه اختصاصی خود (وب‌سایت، وردپرس، FiveM، VMP، MTA و...) فرم زیر را تکمیل کنید.
      </p>
      <Card className="mt-8">
        <CustomDevelopmentForm />
      </Card>
    </div>
  );
}

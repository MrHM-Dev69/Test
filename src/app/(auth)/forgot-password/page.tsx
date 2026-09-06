import { ensureCsrfCookie } from "@/lib/security/csrf";
import { ForgotPasswordForm } from "./forgot-password-form";

export const metadata = { title: "بازیابی رمز عبور" };

export default async function ForgotPasswordPage() {
  await ensureCsrfCookie();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <ForgotPasswordForm />
    </div>
  );
}

import { ensureCsrfCookie } from "@/lib/security/csrf";
import { RegisterForm } from "./register-form";

export const metadata = { title: "ثبت‌نام" };

export default async function RegisterPage() {
  await ensureCsrfCookie();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <RegisterForm />
    </div>
  );
}

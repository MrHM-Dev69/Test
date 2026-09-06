import { Suspense } from "react";
import { ensureCsrfCookie } from "@/lib/security/csrf";
import { LoginForm } from "./login-form";

export const metadata = { title: "ورود" };

export default async function LoginPage() {
  await ensureCsrfCookie();
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}

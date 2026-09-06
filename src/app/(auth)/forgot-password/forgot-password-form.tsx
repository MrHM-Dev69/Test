"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/security/csrf-client";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "reset">("request");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await csrfFetch("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ destination, purpose: "RESET_PASSWORD" }),
      });
      setStep("reset");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ destination, code, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا");
        return;
      }
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>بازیابی رمز عبور</CardTitle>
        <CardDescription>کد تایید برای موبایل یا ایمیل شما ارسال می‌شود</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "request" ? (
          <form onSubmit={handleRequest} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="destination">موبایل یا ایمیل</Label>
              <Input id="destination" value={destination} onChange={(e) => setDestination(e.target.value)} required />
            </div>
            <Button type="submit" disabled={loading}>
              ارسال کد بازیابی
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="code">کد تایید</Label>
              <Input id="code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} required />
            </div>
            <div>
              <Label htmlFor="newPassword">رمز عبور جدید</Label>
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading}>
              تغییر رمز عبور
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted">
        <Link href="/login" className="text-accent hover:underline">
          بازگشت به ورود
        </Link>
      </CardFooter>
    </Card>
  );
}

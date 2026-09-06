"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/security/csrf-client";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";

  const [mode, setMode] = useState<"password" | "otp">("password");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [requiresTotp, setRequiresTotp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password, totpCode: totpCode || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ورود");
        return;
      }
      if (data.requiresTotp) {
        setRequiresTotp(true);
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleRequestOtp() {
    setLoading(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ destination: identifier, purpose: "LOGIN" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ارسال کد");
        return;
      }
      setOtpSent(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/otp-login", {
        method: "POST",
        body: JSON.stringify({ destination: identifier, code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ورود");
        return;
      }
      router.push(next);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>ورود به حساب کاربری</CardTitle>
        <CardDescription>با رمز عبور یا کد یکبار مصرف وارد شوید</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex gap-2 rounded-lg bg-surface p-1 text-sm">
          <button
            type="button"
            onClick={() => setMode("password")}
            className={`flex-1 rounded-md py-1.5 ${mode === "password" ? "bg-accent text-white" : "text-muted"}`}
          >
            رمز عبور
          </button>
          <button
            type="button"
            onClick={() => setMode("otp")}
            className={`flex-1 rounded-md py-1.5 ${mode === "otp" ? "bg-accent text-white" : "text-muted"}`}
          >
            کد یکبار مصرف
          </button>
        </div>

        {mode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="identifier">موبایل یا ایمیل</Label>
              <Input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="password">رمز عبور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {requiresTotp && (
              <div>
                <Label htmlFor="totp">کد تایید دومرحله‌ای</Label>
                <Input id="totp" value={totpCode} onChange={(e) => setTotpCode(e.target.value)} maxLength={6} required />
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "در حال ورود..." : "ورود"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleOtpLogin} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="otp-identifier">موبایل یا ایمیل</Label>
              <Input id="otp-identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
            </div>
            {!otpSent ? (
              <Button type="button" onClick={handleRequestOtp} disabled={loading || !identifier}>
                ارسال کد
              </Button>
            ) : (
              <div>
                <Label htmlFor="code">کد ارسال شده</Label>
                <Input id="code" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6} required />
              </div>
            )}
            {error && <p className="text-sm text-red-400">{error}</p>}
            {otpSent && (
              <Button type="submit" disabled={loading}>
                تایید و ورود
              </Button>
            )}
          </form>
        )}
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm text-muted">
        <Link href="/forgot-password" className="text-accent hover:underline">
          رمز عبور را فراموش کرده‌اید؟
        </Link>
        <span>
          حساب ندارید؟{" "}
          <Link href="/register" className="text-accent hover:underline">
            ثبت‌نام کنید
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}

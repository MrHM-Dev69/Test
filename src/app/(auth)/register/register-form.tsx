"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/security/csrf-client";

export function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "otp">("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function requestOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/otp/request", {
        method: "POST",
        body: JSON.stringify({ destination: phone, purpose: "REGISTER" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ارسال کد");
        return;
      }
      setStep("otp");
    } finally {
      setLoading(false);
    }
  }

  async function completeRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await csrfFetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, phone, password, otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "خطا در ثبت‌نام");
        return;
      }
      router.push("/");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>ساخت حساب کاربری</CardTitle>
        <CardDescription>با شماره موبایل ثبت‌نام کنید</CardDescription>
      </CardHeader>
      <CardContent>
        {step === "details" ? (
          <form onSubmit={requestOtp} className="flex flex-col gap-3">
            <div>
              <Label htmlFor="name">نام و نام خانوادگی</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="phone">شماره موبایل</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="09123456789" required />
            </div>
            <div>
              <Label htmlFor="password">رمز عبور</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading || !name || !phone || !password}>
              {loading ? "در حال ارسال..." : "دریافت کد تایید"}
            </Button>
          </form>
        ) : (
          <form onSubmit={completeRegister} className="flex flex-col gap-3">
            <p className="text-sm text-muted">کد تایید به شماره {phone} ارسال شد.</p>
            <div>
              <Label htmlFor="otp">کد تایید</Label>
              <Input id="otp" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} maxLength={6} required />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <Button type="submit" disabled={loading}>
              {loading ? "در حال ثبت‌نام..." : "تکمیل ثبت‌نام"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="text-sm text-muted">
        <span>
          قبلاً ثبت‌نام کرده‌اید؟{" "}
          <Link href="/login" className="text-accent hover:underline">
            ورود
          </Link>
        </span>
      </CardFooter>
    </Card>
  );
}

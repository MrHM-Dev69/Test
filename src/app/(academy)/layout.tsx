import Link from "next/link";
import { ensureCsrfCookie } from "@/lib/security/csrf";
import { getCurrentUser } from "@/lib/auth/session";

const NAV_LINKS = [
  { href: "/academy", label: "خانه آکادمی" },
  { href: "/academy/courses", label: "دوره‌ها" },
  { href: "/academy/courses/free", label: "دوره‌های رایگان" },
  { href: "/academy/tutorials", label: "آموزش‌ها" },
  { href: "/academy/articles", label: "مقالات" },
  { href: "/academy/roadmaps", label: "نقشه‌راه‌ها" },
  { href: "/academy/resources", label: "منابع" },
];

export default async function AcademyLayout({ children }: { children: React.ReactNode }) {
  await ensureCsrfCookie();
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-surface sticky top-0 z-40 w-full rounded-none border-x-0 border-t-0">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/academy" className="text-lg font-bold text-gradient-accent">
            آکادمی
          </Link>
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            {NAV_LINKS.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="flex items-center gap-3 text-sm">
            {user ? (
              <Link href="/academy/my/courses" className="text-accent hover:underline">
                دوره‌های من
              </Link>
            ) : (
              <Link href="/login" className="text-accent hover:underline">
                ورود
              </Link>
            )}
          </div>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        <p>تمامی حقوق محفوظ است &copy; {new Date().getFullYear()} — آکادمی</p>
      </footer>
    </div>
  );
}

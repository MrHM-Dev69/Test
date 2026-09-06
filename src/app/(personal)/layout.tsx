import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "خانه" },
  { href: "/about", label: "درباره من" },
  { href: "/skills", label: "مهارت‌ها" },
  { href: "/experience", label: "سوابق کاری" },
  { href: "/portfolio", label: "نمونه‌کارها" },
  { href: "/services", label: "خدمات" },
  { href: "/testimonials", label: "نظرات" },
  { href: "/resume", label: "رزومه" },
  { href: "/contact", label: "تماس" },
];

export default function PersonalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-surface sticky top-0 z-40 mx-auto mt-0 w-full rounded-none border-x-0 border-t-0">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="text-lg font-bold text-gradient-accent">
            برند شخصی
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
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border py-8 text-center text-sm text-muted">
        <p>
          تمامی حقوق محفوظ است &copy; {new Date().getFullYear()} — برند شخصی
        </p>
        <div className="mt-2 flex justify-center gap-4">
          <Link href="/shop" className="hover:text-foreground">
            فروشگاه
          </Link>
          <Link href="/academy" className="hover:text-foreground">
            آکادمی
          </Link>
          <Link href="/contact" className="hover:text-foreground">
            تماس با من
          </Link>
        </div>
      </footer>
    </div>
  );
}

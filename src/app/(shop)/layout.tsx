import Link from "next/link";
import { ensureCsrfCookie } from "@/lib/security/csrf";

const NAV_LINKS = [
  { href: "/shop", label: "همه محصولات" },
  { href: "/shop/free", label: "رایگان" },
  { href: "/shop/premium", label: "ویژه" },
  { href: "/shop/cart", label: "سبد خرید" },
  { href: "/shop/orders", label: "سفارش‌های من" },
  { href: "/shop/downloads", label: "دانلودها" },
  { href: "/shop/wishlist", label: "علاقه‌مندی‌ها" },
];

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  await ensureCsrfCookie();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="glass-surface sticky top-0 z-40 w-full rounded-none border-x-0 border-t-0">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/shop" className="text-lg font-bold text-gradient-accent">
            فروشگاه دیجیتال
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
        <p>تمامی حقوق محفوظ است &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}

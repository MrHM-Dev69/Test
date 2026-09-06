export interface AdminNavItem {
  label: string;
  href: string;
}

export interface AdminNavGroup {
  label: string;
  href?: string;
  /** Dot-prefixes checked against the role's permission keys (canAccessPrefix). */
  permissionPrefixes?: string[];
  items?: AdminNavItem[];
}

// Grouped exactly per the shared admin-panel spec. Link targets are stable
// even for pages other agents build concurrently (personal/shop/academy).
export const ADMIN_NAV: AdminNavGroup[] = [
  { label: "داشبورد", href: "/admin" },
  {
    label: "برند شخصی",
    permissionPrefixes: ["personal."],
    items: [
      { label: "پروفایل", href: "/admin/personal/profile" },
      { label: "مهارت‌ها", href: "/admin/personal/skills" },
      { label: "سوابق کاری", href: "/admin/personal/experience" },
      { label: "نمونه‌کارها", href: "/admin/personal/portfolio" },
      { label: "خدمات", href: "/admin/personal/services" },
      { label: "نظرات مشتریان", href: "/admin/personal/testimonials" },
    ],
  },
  {
    label: "فروشگاه",
    permissionPrefixes: ["shop."],
    items: [
      { label: "محصولات", href: "/admin/shop/products" },
      { label: "دسته‌بندی‌ها", href: "/admin/shop/categories" },
      { label: "برچسب‌ها", href: "/admin/shop/tags" },
      { label: "سفارش‌ها", href: "/admin/shop/orders" },
      { label: "کدهای تخفیف", href: "/admin/shop/coupons" },
      { label: "کارت‌های هدیه", href: "/admin/shop/gift-cards" },
      { label: "نظرات", href: "/admin/shop/reviews" },
      { label: "پرسش و پاسخ", href: "/admin/shop/questions" },
      { label: "دانلودها", href: "/admin/shop/downloads" },
      { label: "لایسنس‌ها", href: "/admin/shop/licenses" },
      { label: "گزارش فروش", href: "/admin/shop/reports" },
    ],
  },
  {
    label: "آکادمی",
    permissionPrefixes: ["academy."],
    items: [
      { label: "داشبورد", href: "/admin/academy" },
      { label: "دوره‌ها", href: "/admin/academy/courses" },
      { label: "دسته‌بندی‌ها", href: "/admin/academy/categories" },
      { label: "دانشجویان", href: "/admin/academy/students" },
      { label: "ثبت‌نام‌ها", href: "/admin/academy/enrollments" },
      { label: "نظرات", href: "/admin/academy/reviews" },
      { label: "پرسش و پاسخ", href: "/admin/academy/questions" },
      { label: "مقالات و آموزش‌ها", href: "/admin/academy/articles" },
    ],
  },
  { label: "مشتریان", href: "/admin/customers", permissionPrefixes: ["customers."] },
  { label: "پروژه‌ها", href: "/admin/projects", permissionPrefixes: ["projects."] },
  { label: "حسابداری", href: "/admin/accounting", permissionPrefixes: ["accounting."] },
  { label: "بازاریابی", href: "/admin/marketing", permissionPrefixes: ["marketing."] },
  { label: "ارتباطات", href: "/admin/communication", permissionPrefixes: ["communication.", "support."] },
  { label: "تحلیل و آمار", href: "/admin/analytics", permissionPrefixes: ["analytics."] },
  { label: "امنیت", href: "/admin/security", permissionPrefixes: ["security."] },
  { label: "تنظیمات", href: "/admin/settings", permissionPrefixes: ["settings."] },
];

# پلتفرم برند شخصی — فروشگاه دیجیتال و آکادمی

یک اکوسیستم کامل و Production-Ready شامل سه بخش:

- **برند شخصی / رزومه** — معرفی، مهارت‌ها، تجربه، نمونه‌کارها، خدمات
- **فروشگاه دیجیتال** — محصولات رایگان و پولی، سبد خرید، پرداخت، دانلود امن
- **آکادمی** — دوره‌ها، درس‌ها، پیشرفت یادگیری، آزمون، گواهی‌نامه

ساخته‌شده با Next.js 16 (App Router) + TypeScript + PostgreSQL + Prisma + Tailwind CSS v4.
هیچ بخشی Mock/Fake نیست — همه‌چیز به دیتابیس واقعی و APIهای واقعی پرداخت/پیامک/ایمیل متصل است.

## پیش‌نیازها

- Node.js 22+
- pnpm (`corepack enable` یا `npm i -g pnpm`)
- PostgreSQL 16+ (لوکال یا Docker)

## نصب و راه‌اندازی (Local Development)

```bash
# ۱. نصب پکیج‌ها
pnpm install

# ۲. کپی فایل محیطی
cp .env.example .env
# سپس DATABASE_URL و AUTH_JWT_SECRET / DOWNLOAD_SIGNING_SECRET را با مقادیر واقعی پر کنید

# ۳. اجرای PostgreSQL (اگر لوکال نصب است)
sudo service postgresql start
sudo -u postgres createdb brandplatform

# یا با Docker:
docker compose up -d postgres

# ۴. اجرای Migrationها
pnpm prisma migrate deploy

# ۵. اجرای Seed (داده‌های نمونه واقعی)
pnpm prisma db seed

# ۶. اجرای پروژه در حالت توسعه
pnpm dev
```

سایت روی `http://localhost:3000` بالا می‌آید.

### حساب‌های نمونه (بعد از seed)

| نقش | ایمیل | رمز عبور |
|---|---|---|
| مدیر ارشد (SUPER_ADMIN) | admin@example.com | Admin@12345 |
| مشتری نمونه (CUSTOMER) | customer@example.com | Customer@12345 |

پنل مدیریت: `/admin` — فقط برای نقش‌های مدیریتی قابل دسترسی است.

## پیکربندی سرویس‌های خارجی

همه سرویس‌های خارجی به‌صورت Provider-based طراحی شده‌اند تا بدون تغییر Core قابل تعویض باشند.

### درگاه پرداخت (`src/lib/payments/`)

`ACTIVE_PAYMENT_PROVIDER` را روی `ZARINPAL`، `IDPAY` یا `CUSTOM_GATEWAY` تنظیم کنید و مقادیر مربوطه (`ZARINPAL_MERCHANT_ID`, `IDPAY_API_KEY`, ...) را در `.env` پر کنید. بدون این مقادیر، درخواست پرداخت با خطای واقعی از سمت درگاه مواجه می‌شود (نه یک پاسخ ساختگی) — این رفتار صحیح و مورد انتظار است.

برای افزودن یک درگاه جدید: یک فایل جدید مطابق `PaymentProviderAdapter` در `src/lib/payments/` بسازید و آن را در `src/lib/payments/index.ts` ثبت کنید.

### پیامک (`src/lib/sms/`)

`ACTIVE_SMS_PROVIDER` را روی `KAVENEGAR` یا `SMSIR` تنظیم کنید و کلید API مربوطه را وارد کنید.

### ایمیل (`src/lib/email/`)

مقادیر `SMTP_HOST`/`SMTP_USER`/`SMTP_PASSWORD` را برای فعال‌سازی ارسال واقعی ایمیل وارد کنید.

### ذخیره‌سازی فایل (`src/lib/storage/`)

پیش‌فرض: دیسک لوکال (`STORAGE_DRIVER=local`) در مسیر خصوصی `storage/private` (خارج از دسترس مستقیم وب).
برای Production توصیه می‌شود `STORAGE_DRIVER=s3` و مقادیر `S3_*` را برای یک سرویس S3-Compatible (مثل Arvan Cloud Object Storage, Liara, یا AWS S3) تنظیم کنید.

فایل‌های دیجیتال هرگز با لینک مستقیم قابل دسترس نیستند — تنها از طریق توکن امضاشده (HMAC) و کوتاه‌مدت در `/api/shop/downloads/stream` قابل دریافت‌اند.

## دستورات مفید

```bash
pnpm dev                        # اجرای توسعه
pnpm build                      # ساخت نسخه Production
pnpm start                      # اجرای نسخه Production ساخته‌شده
pnpm prisma studio               # مشاهده/ویرایش دیتابیس با رابط گرافیکی
pnpm prisma migrate dev --name x # ساخت Migration جدید در توسعه
pnpm prisma db seed              # اجرای مجدد Seed
npx tsc --noEmit                 # بررسی کامل TypeScript
```

## استقرار Production

### با Docker Compose

```bash
cp .env.example .env   # مقادیر واقعی را پر کنید
docker compose up -d --build
docker compose exec app pnpm prisma migrate deploy
docker compose exec app pnpm prisma db seed   # اختیاری، فقط بار اول
```

این‌کار PostgreSQL و اپلیکیشن (build شده با خروجی Next.js `standalone`) را بالا می‌آورد.

### نکات امنیتی قبل از استقرار واقعی

- `AUTH_JWT_SECRET` و `DOWNLOAD_SIGNING_SECRET` را با مقادیر تصادفی و قوی (حداقل ۳۲ بایت) جایگزین کنید.
- `NODE_ENV=production` را تنظیم کنید تا Cookieهای امن (`Secure`)، HSTS، و غیره فعال شوند.
- HTTPS را از طریق یک Reverse Proxy (Nginx/Caddy/Traefik) پیش‌روی اپلیکیشن قرار دهید.
- پشتیبان‌گیری منظم از PostgreSQL (`pg_dump`) و از دایرکتوری `storage/private` تنظیم کنید.
- Rate limiting فعلی In-Process است؛ برای استقرار چند-نمونه‌ای (Horizontal Scaling)، `src/lib/security/rate-limit.ts` را با یک Store مبتنی بر Redis جایگزین کنید (امضای تابع تغییری نمی‌کند).

## معماری

```
src/
├── app/
│   ├── (personal)/     صفحات برند شخصی (Home, About, Portfolio, ...)
│   ├── (shop)/          فروشگاه (Products, Cart, Checkout, Orders, ...)
│   ├── (academy)/       آکادمی (Courses, Lessons, Progress, ...)
│   ├── (auth)/          ورود/ثبت‌نام/بازیابی رمز
│   ├── admin/           پنل مدیریت (Personal/Shop/Academy/Customers/...)
│   ├── api/             تمام API Route Handlerها
│   ├── legal/           صفحات حقوقی (قوانین، حریم خصوصی، ...)
│   └── custom-development/  فرم سفارش پروژه اختصاصی
├── components/          کامپوننت‌های UI مشترک (ui/, seo/, shop/, academy/, admin/)
├── lib/
│   ├── auth/            احراز هویت، JWT، OTP، RBAC، رمز عبور
│   ├── payments/        Adapterهای درگاه پرداخت (Provider-based)
│   ├── sms/             Adapterهای پیامک (Provider-based)
│   ├── email/            ارسال ایمیل + Templateها
│   ├── storage/          ذخیره‌سازی فایل + دانلود امن با توکن امضاشده
│   ├── security/         Rate limiting، CSRF
│   ├── shop/, academy/   Query helperها و منطق Fulfillment مخصوص هر دامنه
│   └── validation/       Schemaهای Zod
└── proxy.ts              میان‌افزار امنیتی (CSP، Security Headers، CSRF Gate)

prisma/
├── schema.prisma        اسکیمای کامل دیتابیس (~۴۰ مدل)
├── migrations/           تاریخچه Migrationها
└── seed.ts               داده‌های نمونه واقعی
```

## امنیت (Defense-in-Depth)

- رمزنگاری رمز عبور با bcrypt (۱۲ round)
- Sessionهای JWT قابل ابطال (بررسی‌شده در دیتابیس روی هر درخواست)
- OTP با محدودیت تلاش و Cooldown
- 2FA (TOTP) برای نقش‌های مدیریتی
- محافظت CSRF (Double-submit Cookie) روی تمام درخواست‌های تغییردهنده
- Security Headers کامل + CSP
- اعتبارسنجی آپلود فایل (پسوند + Magic Number + اندازه + جلوگیری از Path Traversal)
- محدودیت نرخ درخواست (Rate Limiting) روی مسیرهای حساس (ورود، OTP، پرداخت، دانلود)
- ثبت کامل رویدادهای حساس در Audit Log
- تایید پرداخت همیشه Server-side (هرگز بر اساس پارامترهای Client)
- دانلود فایل‌های دیجیتال فقط از طریق توکن امضاشده و کوتاه‌مدت

این یک ادعای "امنیت ۱۰۰٪" نیست — بلکه مجموعه‌ای معقول و لایه‌ای از کنترل‌های امنیتی سطح Production است که نیاز به مانیتورینگ و به‌روزرسانی مداوم دارد.

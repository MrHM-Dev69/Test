import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { OrganizationJsonLd } from "@/components/seo/json-ld";
import { env } from "@/lib/env";

const vazirmatn = Vazirmatn({
  variable: "--font-vazirmatn",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.APP_URL),
  title: {
    default: "برند شخصی | توسعه‌دهنده وب، فروشگاه دیجیتال و آکادمی",
    template: "%s | برند شخصی",
  },
  description:
    "پلتفرم برند شخصی، فروشگاه محصولات دیجیتال و آکادمی آموزش برنامه‌نویسی وب، وردپرس، FiveM، VMP و MTA.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "fa_IR",
    siteName: "برند شخصی",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fa" dir="rtl" className={`${vazirmatn.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>{children}</Providers>
        <OrganizationJsonLd />
      </body>
    </html>
  );
}

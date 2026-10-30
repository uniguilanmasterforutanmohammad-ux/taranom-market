import type { Metadata, Viewport } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const metadata: Metadata = {
  title: {
    default: "جوانه‌بازار | بازارچهٔ ساخته‌های بچه‌ها",
    template: "%s | جوانه‌بازار",
  },
  description:
    "بازارچهٔ آنلاین کودکان و نوجوانان؛ ثبت محصول، تأیید والدین، بازبینی انسانی و فروش امن ساخته‌های بچه‌ها.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b5d43",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

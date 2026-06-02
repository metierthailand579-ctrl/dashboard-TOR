import type { Metadata } from "next";
import { Noto_Sans_Thai } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";

const notoThai = Noto_Sans_Thai({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-thai",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ระบบเอกสารจัดซื้อจัดจ้าง (TOR)",
    template: "%s | ระบบเอกสารจัดซื้อจัดจ้าง",
  },
  description:
    "ระบบเปิดดูและค้นหาเอกสาร TOR งานจัดซื้อจัดจ้าง จำแนกตามประเภทและช่วงวงเงินงบประมาณ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className={notoThai.variable}>
      <body className="font-sans">
        <SiteHeader />
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
          ระบบเอกสารจัดซื้อจัดจ้าง · ข้อมูลจากไฟล์โครงสร้างโฟลเดอร์รวม TOR
        </footer>
      </body>
    </html>
  );
}

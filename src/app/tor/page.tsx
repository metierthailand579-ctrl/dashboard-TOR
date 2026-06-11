import type { Metadata } from "next";
import Link from "next/link";
import { getTorItems } from "@/lib/data";
import { TorBoard } from "@/components/TorBoard";

export const metadata: Metadata = {
  title: "งานจัดทำ TOR",
  description:
    "ติดตามสถานะการจัดทำเอกสาร TOR แต่ละโครงการ (to do → skill.md → วางโครงร่าง TOR → เสร็จสมบูรณ์)",
};

export default function TorPage() {
  const items = getTorItems();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">งานจัดทำ TOR</h1>
          <p className="mt-1 text-sm text-slate-500">
            ติดตามสถานะการจัดทำเอกสาร TOR แต่ละโครงการ และอัปเดตสถานะได้เอง
          </p>
        </div>
        <Link
          href="/table"
          className="shrink-0 rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          ตารางข้อมูล →
        </Link>
      </div>

      <TorBoard items={items} />
    </div>
  );
}

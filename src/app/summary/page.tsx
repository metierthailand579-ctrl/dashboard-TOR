import type { Metadata } from "next";
import Link from "next/link";
import { getProjectsWithHealth } from "@/lib/data";
import { SummaryClient } from "@/components/SummaryClient";

export const metadata: Metadata = {
  title: "สรุปภาพรวมข้อมูล",
  description:
    "สรุปเนื้อหาข้อมูลทั้งหมด: จำนวนโครงการ/ไฟล์ การเข้าถึงข้อความ (OCR) กลุ่มงาน และโอกาสธุรกิจ Metier — กรองได้",
};

export default function SummaryPage() {
  const projects = getProjectsWithHealth();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">สรุปภาพรวมข้อมูล</h1>
          <p className="mt-1 text-sm font-light text-slate-500">
            กรองเงื่อนไขแล้วตัวเลข/กราฟจะอัปเดตตาม — โครงการ ไฟล์ การเข้าถึงข้อความ กลุ่มงาน และโอกาส Metier
          </p>
        </div>
        <Link
          href="/table"
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2 text-sm text-white transition hover:bg-brand-700"
        >
          ไปที่ตารางข้อมูล →
        </Link>
      </div>

      <SummaryClient projects={projects} />
    </div>
  );
}

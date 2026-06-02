import type { Metadata } from "next";
import Link from "next/link";
import { getHealthSummary, getProjectsWithHealth } from "@/lib/data";
import { TableDashboard } from "@/components/TableDashboard";

export const metadata: Metadata = {
  title: "ตารางข้อมูลโครงการ",
  description:
    "ตารางรวมทุกโครงการจัดซื้อจัดจ้าง กรองตามประเภท/ช่วงวงเงิน/หมวด เรียงทุกคอลัมน์ ตรวจสถานะ TOR และส่งออก CSV",
};

export default function TablePage() {
  const projects = getProjectsWithHealth();
  const healthSummary = getHealthSummary();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">ตารางข้อมูลโครงการ</h1>
          <p className="mt-1 text-sm text-slate-500">
            กรองตามเงื่อนไข เรียงลำดับทุกคอลัมน์ และส่งออกเป็น CSV
          </p>
        </div>
        <Link
          href="/summary"
          className="shrink-0 rounded-md border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          ← สรุปภาพรวม
        </Link>
      </div>

      <TableDashboard projects={projects} healthSummary={healthSummary} />
    </div>
  );
}

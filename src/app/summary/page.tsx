import type { Metadata } from "next";
import Link from "next/link";
import { getFileSummary, getHealthSummary, getProjectsWithHealth } from "@/lib/data";
import { BUDGET_ORDER, PROCUREMENT_TYPES } from "@/lib/constants";
import { TableSummary } from "@/components/TableSummary";

export const metadata: Metadata = {
  title: "สรุปภาพรวมข้อมูล",
  description:
    "สรุปเนื้อหาข้อมูลทั้งหมด: จำนวนโครงการ/ไฟล์ การเข้าถึงข้อความ (OCR) กลุ่มงาน และโอกาสธุรกิจ Metier",
};

export default function SummaryPage() {
  const projects = getProjectsWithHealth();
  const healthSummary = getHealthSummary();

  // ---- คำนวณสรุปภาพรวม (ข้อมูลทั้งหมด) ----
  const totalFiles = projects.reduce((s, p) => s + p.fileCount, 0);

  const fileHealth = projects.reduce(
    (acc, p) => ({
      readable: acc.readable + p.health.counts.readable,
      ocr: acc.ocr + p.health.counts.ocr,
      unreadable: acc.unreadable + p.health.counts.unreadable,
      total: acc.total + p.health.counts.total,
    }),
    { readable: 0, ocr: 0, unreadable: 0, total: 0 }
  );

  const byType = PROCUREMENT_TYPES.map((type) => {
    const items = projects.filter((p) => p.type === type);
    return {
      type,
      projectCount: items.length,
      fileCount: items.reduce((s, p) => s + p.fileCount, 0),
    };
  });

  const byBudget = BUDGET_ORDER.map((budget) => ({
    budget,
    count: projects.filter((p) => p.budgetRange === budget).length,
  }));

  // กลุ่มงาน (ระบบ A) — เรียงตามเลขนำหน้า "1." .. "7."
  const groupMap = new Map<string, number>();
  for (const p of projects) groupMap.set(p.workGroup, (groupMap.get(p.workGroup) ?? 0) + 1);
  const byGroup = Array.from(groupMap.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => a.group.localeCompare(b.group, "th"));

  // Metier (ระบบ B) — โอกาสก่อน, NOT_APPLICABLE ท้าย
  const metierMap = new Map<string, number>();
  for (const p of projects) metierMap.set(p.metierGroup, (metierMap.get(p.metierGroup) ?? 0) + 1);
  const byMetier = Array.from(metierMap.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => {
      if (a.group === "NOT_APPLICABLE") return 1;
      if (b.group === "NOT_APPLICABLE") return -1;
      return b.count - a.count;
    });
  const metierOpportunities = projects.filter((p) => p.metierGroup !== "NOT_APPLICABLE").length;

  const summary = {
    totalProjects: projects.length,
    totalFiles,
    fileHealth,
    fileSummary: getFileSummary(),
    healthSummary,
    byType,
    byBudget,
    byGroup,
    byMetier,
    metierOpportunities,
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">สรุปภาพรวมข้อมูล</h1>
          <p className="mt-1 text-sm text-slate-500">
            สรุปเนื้อหาข้อมูลทั้งหมด — โครงการ ไฟล์ การเข้าถึงข้อความ กลุ่มงาน และโอกาสธุรกิจ Metier
          </p>
        </div>
        <Link
          href="/table"
          className="shrink-0 rounded-md bg-brand-600 px-4 py-2 text-sm text-white transition hover:bg-brand-700"
        >
          ไปที่ตารางข้อมูล →
        </Link>
      </div>

      <TableSummary summary={summary} />
    </div>
  );
}

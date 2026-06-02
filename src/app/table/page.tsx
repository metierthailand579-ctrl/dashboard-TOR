import type { Metadata } from "next";
import { getHealthSummary, getProjectsWithHealth } from "@/lib/data";
import { BUDGET_ORDER, PROCUREMENT_TYPES } from "@/lib/constants";
import { TableDashboard } from "@/components/TableDashboard";
import { TableSummary } from "@/components/TableSummary";

export const metadata: Metadata = {
  title: "ตารางข้อมูลโครงการ",
  description:
    "ตารางรวมทุกโครงการจัดซื้อจัดจ้าง กรองตามประเภท/ช่วงวงเงิน/หมวด เรียงทุกคอลัมน์ ตรวจสถานะ TOR และส่งออก CSV",
};

export default function TablePage() {
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

  const groupMap = new Map<string, number>();
  for (const p of projects) groupMap.set(p.group, (groupMap.get(p.group) ?? 0) + 1);
  const byGroup = Array.from(groupMap.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => b.count - a.count);

  const summary = {
    totalProjects: projects.length,
    totalFiles,
    fileHealth,
    healthSummary,
    byType,
    byBudget,
    byGroup,
  };

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">ตารางข้อมูลโครงการ</h1>
        <p className="mt-1 text-sm text-slate-500">
          กรองตามเงื่อนไข เรียงลำดับทุกคอลัมน์ และส่งออกเป็น CSV
        </p>
      </div>

      <TableSummary summary={summary} />

      <TableDashboard projects={projects} healthSummary={healthSummary} />
    </div>
  );
}

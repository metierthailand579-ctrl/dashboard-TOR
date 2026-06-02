import Link from "next/link";
import { getOverview, getStats } from "@/lib/data";
import {
  BUDGET_ORDER,
  BUDGET_SHORT,
  PROCUREMENT_TYPES,
  TYPE_STYLE,
  TYPE_TO_SLUG,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

export default function HomePage() {
  const stats = getStats();
  const overview = getOverview();

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-2xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">
          ระบบเอกสารจัดซื้อจัดจ้าง (TOR)
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-brand-100">
          เปิดดูและค้นหาเอกสาร TOR ของทุกโครงการ จำแนกตามประเภทการจัดซื้อจัดจ้าง
          และช่วงวงเงินงบประมาณ
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-md">
          <Stat label="โครงการ" value={stats.totalProjects} />
          <Stat label="ไฟล์เอกสาร" value={stats.totalFiles} />
          <Stat label="ประเภท" value={stats.typeCount} />
        </div>
      </section>

      {/* การ์ดประเภท */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          เลือกตามประเภทการจัดซื้อจัดจ้าง
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.byType.map((t) => (
            <Link
              key={t.type}
              href={`/type/${TYPE_TO_SLUG[t.type]}`}
              className={cn(
                "group rounded-xl border border-slate-200 border-t-4 bg-white p-5 shadow-sm transition hover:shadow-md",
                TYPE_STYLE[t.type].accent
              )}
            >
              <p className="text-base font-semibold text-slate-800 group-hover:text-brand-700">
                {t.type}
              </p>
              <p className="mt-2 text-3xl font-bold text-slate-900">
                {t.projectCount}
                <span className="ml-1 text-sm font-normal text-slate-400">โครงการ</span>
              </p>
              <p className="mt-1 text-xs text-slate-500">{t.fileCount} ไฟล์เอกสาร</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ตารางภาพรวม */}
      <section>
        <h2 className="mb-4 text-lg font-semibold text-slate-800">
          ภาพรวมตามประเภท × ช่วงวงเงิน
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                <th className="px-4 py-3 font-medium">ประเภท</th>
                {BUDGET_ORDER.map((b) => (
                  <th key={b} className="px-4 py-3 text-center font-medium" title={b}>
                    {BUDGET_SHORT[b]}
                  </th>
                ))}
                <th className="px-4 py-3 text-center font-medium">รวม</th>
              </tr>
            </thead>
            <tbody>
              {PROCUREMENT_TYPES.map((type) => {
                const cells = BUDGET_ORDER.map(
                  (b) =>
                    overview.find((o) => o.type === type && o.budgetRange === b)
                      ?.projectCount ?? 0
                );
                const total = cells.reduce((a, c) => a + c, 0);
                return (
                  <tr key={type} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-700">{type}</td>
                    {cells.map((c, i) => (
                      <td key={i} className="px-4 py-3 text-center text-slate-600">
                        {c || "–"}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-center font-semibold text-brand-700">
                      {total}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-400">ตัวเลข = จำนวนโครงการ (โฟลเดอร์)</p>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-white/10 px-3 py-3 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-brand-100">{label}</p>
    </div>
  );
}

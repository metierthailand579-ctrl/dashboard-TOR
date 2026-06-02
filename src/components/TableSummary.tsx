import type { FileSummary, ProcurementType } from "@/types";
import {
  BUDGET_SHORT,
  METIER_LABEL,
  METIER_NA,
  METIER_STYLE,
  READ_STATUS_ORDER,
  READ_STATUS_STYLE,
  TYPE_STYLE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Summary {
  totalProjects: number;
  totalFiles: number;
  fileHealth: { readable: number; ocr: number; unreadable: number; total: number };
  fileSummary: FileSummary;
  healthSummary: Record<string, number>;
  byType: { type: ProcurementType; projectCount: number; fileCount: number }[];
  byBudget: { budget: string; count: number }[];
  byGroup: { group: string; count: number }[];
  byMetier: { group: string; count: number }[];
  metierOpportunities: number;
}

/** สีแท่งประจำประเภท (literal ให้ Tailwind สแกนเจอ) */
const TYPE_BAR: Record<ProcurementType, string> = {
  ซื้อ: "bg-blue-500",
  เช่า: "bg-emerald-500",
  จ้างก่อสร้าง: "bg-amber-500",
  จ้างเหมาบริการ: "bg-purple-500",
};

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

export function TableSummary({ summary }: { summary: Summary }) {
  const fs = summary.fileSummary;

  // ระดับโครงการ: เรียงตามลำดับสถานะ เฉพาะที่มี
  const projectStatuses = READ_STATUS_ORDER.map((s) => ({
    label: s,
    value: summary.healthSummary[s] ?? 0,
    color: READ_STATUS_STYLE[s].dot,
  })).filter((s) => s.value > 0);

  // การเข้าถึงข้อความระดับไฟล์ (รวมผล OCR แล้ว)
  const accessStatuses = [
    { label: "มี text อยู่แล้ว", value: fs.textReady, color: "bg-emerald-500" },
    { label: "OCR สำเร็จ", value: fs.ocrOk, color: "bg-teal-400" },
    { label: "OCR ไม่สำเร็จ", value: fs.ocrFail, color: "bg-orange-500" },
    { label: "ไฟล์เสีย", value: fs.corrupt, color: "bg-red-500" },
  ].filter((s) => s.value > 0);

  const maxGroup = Math.max(...summary.byGroup.map((g) => g.count), 1);

  return (
    <section className="mb-6 space-y-4">
      <h2 className="text-sm font-semibold text-slate-500">สรุปภาพรวมข้อมูล</h2>

      {/* KPI */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="โครงการทั้งหมด" value={summary.totalProjects} unit="โครงการ" tone="brand" />
        <Kpi label="ไฟล์เอกสาร" value={summary.totalFiles} unit="ไฟล์" tone="slate" />
        <Kpi
          label="เข้าถึงข้อความได้ (รวม OCR)"
          value={fs.accessible}
          unit={`${pct(fs.accessible, fs.total)}%`}
          tone="emerald"
        />
        <Kpi
          label="โอกาสธุรกิจ Metier"
          value={summary.metierOpportunities}
          unit={`จาก ${summary.totalProjects} โครงการ`}
          tone="indigo"
        />
      </div>

      {/* แถบสถานะ */}
      <div className="grid gap-3 md:grid-cols-2">
        <Panel title="สถานะการอ่าน TOR (ระดับโครงการ)" subtitle={`${summary.totalProjects} โครงการ`}>
          <StackedBar segments={projectStatuses} />
          <Legend segments={projectStatuses} total={summary.totalProjects} />
        </Panel>

        <Panel
          title="การเข้าถึงข้อความในไฟล์ (รวม OCR)"
          subtitle={`เข้าถึงได้ ${fs.accessible}/${fs.total} ไฟล์`}
        >
          <StackedBar segments={accessStatuses} />
          <Legend segments={accessStatuses} total={fs.total} />
        </Panel>
      </div>

      {/* ประเภท + งบ + กลุ่ม */}
      <div className="grid gap-3 lg:grid-cols-3">
        <Panel title="แยกตามประเภท">
          <ul className="space-y-2.5">
            {summary.byType.map((t) => (
              <li key={t.type}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">{t.type}</span>
                  <span className="text-slate-400">
                    {t.projectCount} โครงการ · {t.fileCount} ไฟล์
                  </span>
                </div>
                <Bar
                  value={t.projectCount}
                  max={summary.totalProjects}
                  className={TYPE_BAR[t.type]}
                />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="แยกตามช่วงวงเงิน">
          <ul className="space-y-2.5">
            {summary.byBudget.map((b) => (
              <li key={b.budget}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600" title={b.budget}>
                    {BUDGET_SHORT[b.budget] ?? b.budget}
                  </span>
                  <span className="text-slate-400">{b.count} โครงการ</span>
                </div>
                <Bar value={b.count} max={summary.totalProjects} className="bg-brand-500" />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title={`กลุ่มงาน (ระบบ A) · ${summary.byGroup.length} กลุ่ม`}>
          <ul className="space-y-2 pr-1">
            {summary.byGroup.map((g) => (
              <li key={g.group} className="flex items-center gap-2">
                <span className="w-40 shrink-0 truncate text-xs text-slate-600" title={g.group}>
                  {g.group}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-400"
                    style={{ width: `${(g.count / maxGroup) * 100}%` }}
                  />
                </div>
                <span className="w-6 shrink-0 text-right text-xs text-slate-400">{g.count}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      {/* โอกาสธุรกิจ Metier */}
      <Panel
        title="โอกาสธุรกิจ Metier (ระบบ B)"
        subtitle={`${summary.metierOpportunities} โอกาส จาก ${summary.totalProjects} โครงการ`}
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {summary.byMetier.map((m) => {
            const style = METIER_STYLE[m.group] ?? METIER_STYLE[METIER_NA];
            const isNa = m.group === METIER_NA;
            return (
              <li
                key={m.group}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2",
                  isNa ? "border-slate-100 bg-slate-50" : "border-slate-200 bg-white"
                )}
              >
                <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", style.dot)} />
                <span className={cn("flex-1 text-sm", isNa ? "text-slate-400" : "text-slate-700")}>
                  {METIER_LABEL[m.group] ?? m.group}
                </span>
                <span className={cn("text-sm font-semibold", isNa ? "text-slate-400" : "text-slate-800")}>
                  {m.count}
                </span>
              </li>
            );
          })}
        </ul>
      </Panel>
    </section>
  );
}

/* ---------- ชิ้นส่วนย่อย ---------- */

const KPI_TONE: Record<string, string> = {
  brand: "text-brand-700",
  slate: "text-slate-700",
  emerald: "text-emerald-600",
  orange: "text-orange-600",
  indigo: "text-indigo-600",
};

function Kpi({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: number;
  unit: string;
  tone: keyof typeof KPI_TONE;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={cn("mt-1 text-2xl font-bold", KPI_TONE[tone])}>
        {value.toLocaleString("th-TH")}
        <span className="ml-1 text-xs font-normal text-slate-400">{unit}</span>
      </p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
      </div>
      {children}
    </div>
  );
}

function StackedBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
      {segments.map((s) => (
        <div
          key={s.label}
          className={s.color}
          style={{ width: `${(s.value / total) * 100}%` }}
          title={`${s.label}: ${s.value}`}
        />
      ))}
    </div>
  );
}

function Legend({
  segments,
  total,
}: {
  segments: { label: string; value: number; color: string }[];
  total: number;
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {segments.map((s) => (
        <li key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span className={cn("h-2.5 w-2.5 rounded-full", s.color)} />
          {s.label}
          <span className="font-semibold text-slate-700">{s.value}</span>
          <span className="text-slate-400">({pct(s.value, total)}%)</span>
        </li>
      ))}
    </ul>
  );
}

function Bar({ value, max, className }: { value: number; max: number; className: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full", className)} style={{ width: `${(value / max) * 100}%` }} />
    </div>
  );
}

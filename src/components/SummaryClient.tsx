"use client";

import { useMemo, useState } from "react";
import type { HealthStatus, ProcurementType, ProjectWithHealth } from "@/types";
import {
  BUDGET_ORDER,
  BUDGET_SHORT,
  METIER_LABEL,
  METIER_NA,
  METIER_STYLE,
  PROCUREMENT_TYPES,
  READ_STATUS_ORDER,
  READ_STATUS_STYLE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TableSummary } from "@/components/TableSummary";

export function SummaryClient({ projects }: { projects: ProjectWithHealth[] }) {
  const [types, setTypes] = useState<Set<ProcurementType>>(new Set());
  const [budgets, setBudgets] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Set<string>>(new Set());
  const [metiers, setMetiers] = useState<Set<string>>(new Set());
  const [healths, setHealths] = useState<Set<HealthStatus>>(new Set());
  const [onlyMetier, setOnlyMetier] = useState(false);

  const groupOptions = useMemo(
    () => Array.from(new Set(projects.map((p) => p.workGroup))).sort((a, b) => a.localeCompare(b, "th")),
    [projects]
  );
  const metierOptions = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of projects) c.set(p.metierGroup, (c.get(p.metierGroup) ?? 0) + 1);
    return Array.from(c.entries())
      .sort((a, b) => (a[0] === METIER_NA ? 1 : b[0] === METIER_NA ? -1 : b[1] - a[1]))
      .map(([g]) => g);
  }, [projects]);
  const healthOptions = useMemo(() => {
    const present = new Set(projects.map((p) => p.health.status));
    return READ_STATUS_ORDER.filter((s) => present.has(s));
  }, [projects]);

  const filtered = useMemo(
    () =>
      projects.filter((p) => {
        const mType = types.size === 0 || types.has(p.type);
        const mBudget = budgets.size === 0 || budgets.has(p.budgetRange);
        const mGroup = groups.size === 0 || groups.has(p.workGroup);
        const mMetier = metiers.size === 0 || metiers.has(p.metierGroup);
        const mHealth = healths.size === 0 || healths.has(p.health.status);
        const mOnly = !onlyMetier || p.metierGroup !== METIER_NA;
        return mType && mBudget && mGroup && mMetier && mHealth && mOnly;
      }),
    [projects, types, budgets, groups, metiers, healths, onlyMetier]
  );

  const summary = useMemo(() => buildSummary(filtered), [filtered]);

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  }
  function clearFilters() {
    setTypes(new Set());
    setBudgets(new Set());
    setGroups(new Set());
    setMetiers(new Set());
    setHealths(new Set());
    setOnlyMetier(false);
  }
  const hasFilter =
    types.size > 0 || budgets.size > 0 || groups.size > 0 ||
    metiers.size > 0 || healths.size > 0 || onlyMetier;

  return (
    <div className="space-y-5">
      {/* แถบฟิลเตอร์ */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <FilterRow label="ประเภท">
          {PROCUREMENT_TYPES.map((t) => (
            <Chip key={t} active={types.has(t)} onClick={() => setTypes((s) => toggleSet(s, t))}>
              {t}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="ช่วงวงเงิน">
          {BUDGET_ORDER.map((b) => (
            <Chip key={b} active={budgets.has(b)} onClick={() => setBudgets((s) => toggleSet(s, b))} title={b}>
              {BUDGET_SHORT[b] ?? b}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="กลุ่มงาน">
          {groupOptions.map((g) => (
            <Chip key={g} active={groups.has(g)} onClick={() => setGroups((s) => toggleSet(s, g))}>
              {g}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Metier">
          {metierOptions.map((m) => (
            <Chip
              key={m}
              active={metiers.has(m)}
              onClick={() => setMetiers((s) => toggleSet(s, m))}
              className={METIER_STYLE[m]?.badge}
            >
              {METIER_LABEL[m] ?? m}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="TOR Health">
          {healthOptions.map((h) => (
            <Chip
              key={h}
              active={healths.has(h)}
              onClick={() => setHealths((s) => toggleSet(s, h as HealthStatus))}
              className={READ_STATUS_STYLE[h]?.badge}
            >
              {h}
            </Chip>
          ))}
        </FilterRow>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyMetier}
              onChange={(e) => setOnlyMetier(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            เฉพาะโอกาสธุรกิจ Metier
          </label>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              ล้างตัวกรอง
            </button>
          )}
          <span className="ml-auto text-sm text-slate-500">
            สรุปจาก <span className="font-semibold text-slate-700">{filtered.length}</span> /{" "}
            {projects.length} โครงการ
          </span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-12 text-center text-slate-400">
          ไม่มีโครงการตรงกับเงื่อนไข — ปรับตัวกรอง
        </div>
      ) : (
        <TableSummary summary={summary} />
      )}
    </div>
  );
}

/** คำนวณสรุปจากรายการที่กรองแล้ว (โครงสร้างตรงกับที่ TableSummary ใช้) */
function buildSummary(projects: ProjectWithHealth[]) {
  const totalFiles = projects.reduce((s, p) => s + p.fileCount, 0);

  const fileHealth = projects.reduce(
    (a, p) => ({
      readable: a.readable + p.health.counts.readable,
      ocr: a.ocr + p.health.counts.ocr,
      unreadable: a.unreadable + p.health.counts.unreadable,
      total: a.total + p.health.counts.total,
    }),
    { readable: 0, ocr: 0, unreadable: 0, total: 0 }
  );

  const fileSummary = projects.reduce(
    (a, p) => ({
      textReady: a.textReady + p.health.counts.readable,
      ocrOk: a.ocrOk + p.health.counts.ocrOk,
      ocrFail: a.ocrFail + p.health.counts.ocrFail,
      corrupt: a.corrupt + p.health.counts.unreadable,
      accessible: a.accessible + p.health.counts.accessible,
      total: a.total + p.health.counts.total,
    }),
    { textReady: 0, ocrOk: 0, ocrFail: 0, corrupt: 0, accessible: 0, total: 0 }
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
  for (const p of projects) groupMap.set(p.workGroup, (groupMap.get(p.workGroup) ?? 0) + 1);
  const byGroup = Array.from(groupMap.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => a.group.localeCompare(b.group, "th"));

  const metierMap = new Map<string, number>();
  for (const p of projects) metierMap.set(p.metierGroup, (metierMap.get(p.metierGroup) ?? 0) + 1);
  const byMetier = Array.from(metierMap.entries())
    .map(([group, count]) => ({ group, count }))
    .sort((a, b) => (a.group === METIER_NA ? 1 : b.group === METIER_NA ? -1 : b.count - a.count));

  const healthSummary: Record<string, number> = {};
  for (const p of projects) healthSummary[p.health.status] = (healthSummary[p.health.status] ?? 0) + 1;

  return {
    totalProjects: projects.length,
    totalFiles,
    fileHealth,
    fileSummary,
    healthSummary,
    byType,
    byBudget,
    byGroup,
    byMetier,
    metierOpportunities: projects.filter((p) => p.metierGroup !== METIER_NA).length,
  };
}

/* ---------- ชิ้นส่วนฟิลเตอร์ ---------- */

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="w-20 shrink-0 text-xs font-medium text-slate-400">{label}</span>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
  className,
  title,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-medium transition",
        active
          ? "border-brand-600 bg-brand-600 text-white"
          : cn("border-slate-200 bg-white text-slate-600 hover:border-slate-300", className)
      )}
    >
      {children}
    </button>
  );
}

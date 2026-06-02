"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type {
  HealthStatus,
  ProcurementType,
  ProjectHealth,
  ProjectWithHealth,
} from "@/types";
import {
  BUDGET_ORDER,
  BUDGET_SHORT,
  PROCUREMENT_TYPES,
  READ_STATUS_ORDER,
  READ_STATUS_STYLE,
  TYPE_STYLE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type SortKey =
  | "order"
  | "type"
  | "budgetRange"
  | "group"
  | "subGroup"
  | "code"
  | "name"
  | "fileCount"
  | "health";
type SortDir = "asc" | "desc";
type ViewMode = "flat" | "grouped";

const COLUMNS: { key: SortKey; label: string; align?: "center" }[] = [
  { key: "order", label: "ลำดับ", align: "center" },
  { key: "type", label: "ประเภท" },
  { key: "budgetRange", label: "ช่วงวงเงิน" },
  { key: "group", label: "Group" },
  { key: "subGroup", label: "Sub Group" },
  { key: "code", label: "รหัสโครงการ" },
  { key: "name", label: "ชื่อโครงการ" },
  { key: "fileCount", label: "ไฟล์", align: "center" },
  { key: "health", label: "TOR Health", align: "center" },
];

const HEALTH_OPTIONS = READ_STATUS_ORDER;

export function TableDashboard({
  projects,
  healthSummary,
}: {
  projects: ProjectWithHealth[];
  healthSummary: Record<string, number>;
}) {
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<ProcurementType>>(new Set());
  const [budgets, setBudgets] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Set<string>>(new Set());
  const [healths, setHealths] = useState<Set<HealthStatus>>(new Set());
  const [onlyTor, setOnlyTor] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<ViewMode>("flat");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const groupOptions = useMemo(() => {
    const count = new Map<string, number>();
    for (const p of projects) count.set(p.group, (count.get(p.group) ?? 0) + 1);
    return Array.from(count.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([g]) => g);
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = projects.filter((p) => {
      const matchQuery =
        !q || p.name.toLowerCase().includes(q) || p.code.includes(q);
      const matchType = types.size === 0 || types.has(p.type);
      const matchBudget = budgets.size === 0 || budgets.has(p.budgetRange);
      const matchGroup = groups.size === 0 || groups.has(p.group);
      const matchHealth = healths.size === 0 || healths.has(p.health.status);
      const matchTor = !onlyTor || p.torFiles.length > 0;
      return matchQuery && matchType && matchBudget && matchGroup && matchHealth && matchTor;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sortKey) {
        case "budgetRange":
          return (
            (BUDGET_ORDER.indexOf(a.budgetRange) -
              BUDGET_ORDER.indexOf(b.budgetRange)) *
            dir
          );
        case "name":
        case "type":
        case "group":
        case "subGroup":
          return a[sortKey].localeCompare(b[sortKey], "th") * dir;
        case "code":
          return a.code.localeCompare(b.code) * dir;
        case "fileCount":
          return (a.fileCount - b.fileCount) * dir;
        case "health":
          return (
            (READ_STATUS_ORDER.indexOf(a.health.status) -
              READ_STATUS_ORDER.indexOf(b.health.status)) *
            dir
          );
        default:
          return (a.order - b.order) * dir;
      }
    });
  }, [projects, query, types, budgets, groups, healths, onlyTor, sortKey, sortDir]);

  // โครงสร้างจัดกลุ่ม: Group -> SubGroup -> โครงการ
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, ProjectWithHealth[]>>();
    for (const p of filtered) {
      const subs = map.get(p.group) ?? new Map<string, ProjectWithHealth[]>();
      const arr = subs.get(p.subGroup) ?? [];
      arr.push(p);
      subs.set(p.subGroup, arr);
      map.set(p.group, subs);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "th"));
  }, [filtered]);

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  }

  function onSort(key: SortKey) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setQuery("");
    setTypes(new Set());
    setBudgets(new Set());
    setGroups(new Set());
    setHealths(new Set());
    setOnlyTor(false);
  }

  function exportCsv() {
    const header = [
      "ลำดับ", "ประเภท", "ช่วงวงเงิน", "Group", "Sub Group",
      "รหัสโครงการ", "ชื่อโครงการ", "จำนวนไฟล์",
      "TOR Health", "อ่านได้(ไฟล์)", "ต้อง OCR(ไฟล์)", "อ่านไม่ได้(ไฟล์)",
      "สรุปการอ่าน", "รายชื่อไฟล์",
    ];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = filtered.map((p) =>
      [
        p.order, p.type, p.budgetRange, p.group, p.subGroup,
        p.code, p.name, p.fileCount,
        p.health.status, p.health.counts.readable, p.health.counts.ocr,
        p.health.counts.unreadable, p.health.summary, p.files.join(" | "),
      ]
        .map(escape)
        .join(",")
    );
    const csv = "﻿" + [header.map(escape).join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tor-projects-${filtered.length}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const hasFilter =
    query.trim() !== "" ||
    types.size > 0 ||
    budgets.size > 0 ||
    groups.size > 0 ||
    healths.size > 0 ||
    onlyTor;

  return (
    <div className="space-y-4">
      {/* แถบฟิลเตอร์ */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <SearchIcon />
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อโครงการ หรือรหัสโครงการ…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <FilterRow label="ประเภท">
          {PROCUREMENT_TYPES.map((t) => (
            <Chip key={t} active={types.has(t)} onClick={() => setTypes((s) => toggleSet(s, t))}>
              {t}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="ช่วงวงเงิน">
          {BUDGET_ORDER.map((b) => (
            <Chip
              key={b}
              active={budgets.has(b)}
              onClick={() => setBudgets((s) => toggleSet(s, b))}
              title={b}
            >
              {BUDGET_SHORT[b] ?? b}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="Group">
          {groupOptions.map((g) => (
            <Chip key={g} active={groups.has(g)} onClick={() => setGroups((s) => toggleSet(s, g))}>
              {g}
            </Chip>
          ))}
        </FilterRow>

        <FilterRow label="TOR Health">
          {HEALTH_OPTIONS.filter((h) => (healthSummary[h] ?? 0) > 0).map((h) => (
            <Chip
              key={h}
              active={healths.has(h)}
              onClick={() => setHealths((s) => toggleSet(s, h as HealthStatus))}
              className={READ_STATUS_STYLE[h]?.badge}
            >
              {h} ({healthSummary[h] ?? 0})
            </Chip>
          ))}
        </FilterRow>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyTor}
              onChange={(e) => setOnlyTor(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            เฉพาะที่มีไฟล์ TOR
          </label>

          {/* สลับมุมมอง */}
          <div className="inline-flex overflow-hidden rounded-lg border border-slate-200">
            <ViewButton active={view === "flat"} onClick={() => setView("flat")}>
              ตาราง
            </ViewButton>
            <ViewButton active={view === "grouped"} onClick={() => setView("grouped")}>
              จัดกลุ่ม
            </ViewButton>
          </div>

          {hasFilter && (
            <button
              onClick={clearFilters}
              className="text-sm text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
            >
              ล้างตัวกรอง
            </button>
          )}

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm text-slate-500">
              พบ <span className="font-semibold text-slate-700">{filtered.length}</span> /{" "}
              {projects.length} โครงการ
            </span>
            <button
              onClick={exportCsv}
              disabled={filtered.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white transition hover:bg-brand-700 disabled:opacity-40"
            >
              <DownloadIcon /> CSV
            </button>
          </div>
        </div>
      </div>

      {/* ===== มุมมองตาราง ===== */}
      {view === "flat" && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => onSort(col.key)}
                    className={cn(
                      "cursor-pointer select-none px-4 py-3 font-medium transition hover:text-slate-800",
                      col.align === "center" && "text-center"
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      <SortIndicator active={sortKey === col.key} dir={sortDir} />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.code} className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3 text-center text-slate-400">{p.order}</td>
                  <td className="px-4 py-3">
                    <TypePill type={p.type} />
                  </td>
                  <td className="px-4 py-3 text-slate-600" title={p.budgetRange}>
                    {BUDGET_SHORT[p.budgetRange] ?? p.budgetRange}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{p.group}</td>
                  <td className="max-w-[200px] px-4 py-3 text-slate-500">
                    <span className="line-clamp-1" title={p.subGroup}>{p.subGroup}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-500">{p.code}</td>
                  <td className="max-w-md px-4 py-3">
                    <Link
                      href={`/project/${p.code}`}
                      className="line-clamp-1 text-slate-700 hover:text-brand-700 hover:underline"
                      title={p.name}
                    >
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600">
                    {p.fileCount}
                    {p.torFiles.length > 0 && (
                      <span className="ml-1 align-middle text-[10px] text-brand-600">TOR</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <HealthBadge health={p.health} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-slate-400">
                    ไม่พบโครงการที่ตรงกับเงื่อนไข
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ===== มุมมองจัดกลุ่ม ===== */}
      {view === "grouped" && (
        <div className="space-y-3">
          {grouped.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
              ไม่พบโครงการที่ตรงกับเงื่อนไข
            </div>
          )}
          {grouped.map(([group, subs]) => {
            const items = Array.from(subs.values()).flat();
            const okN = items.filter(
              (p) => p.health.status === "อ่านได้" || p.health.status === "อ่านได้บางส่วน"
            ).length;
            const badN = items.length - okN;
            const isCollapsed = collapsed.has(group);
            return (
              <div key={group} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <button
                  onClick={() => setCollapsed((s) => toggleSet(s, group))}
                  className="flex w-full items-center gap-2 bg-slate-50 px-4 py-3 text-left transition hover:bg-slate-100"
                >
                  <span className={cn("text-slate-400 transition", isCollapsed ? "" : "rotate-90")}>▶</span>
                  <span className="font-semibold text-slate-800">{group}</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-500">
                    {items.length} โครงการ
                  </span>
                  <span className="ml-auto flex items-center gap-2 text-xs">
                    <span className="text-emerald-600">อ่านได้ {okN}</span>
                    {badN > 0 && <span className="text-red-500">มีปัญหา {badN}</span>}
                  </span>
                </button>

                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {Array.from(subs.entries())
                      .sort((a, b) => a[0].localeCompare(b[0], "th"))
                      .map(([sub, rows]) => (
                        <div key={sub} className="px-4 py-2">
                          <div className="mb-1 flex items-center gap-2 pt-1">
                            <span className="text-xs font-medium text-brand-700">↳ {sub}</span>
                            <span className="text-[11px] text-slate-400">({rows.length})</span>
                          </div>
                          <ul className="divide-y divide-slate-50">
                            {rows.map((p) => (
                              <li key={p.code} className="flex items-center gap-3 py-2 pl-4">
                                <TypePill type={p.type} />
                                <span className="font-mono text-xs text-slate-400">{p.code}</span>
                                <Link
                                  href={`/project/${p.code}`}
                                  className="line-clamp-1 flex-1 text-sm text-slate-700 hover:text-brand-700 hover:underline"
                                  title={p.name}
                                >
                                  {p.name}
                                </Link>
                                <span className="hidden text-xs text-slate-400 sm:inline" title={p.budgetRange}>
                                  {BUDGET_SHORT[p.budgetRange]}
                                </span>
                                <HealthBadge health={p.health} />
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- ชิ้นส่วนย่อย ---------- */

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

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-sm transition",
        active ? "bg-brand-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"
      )}
    >
      {children}
    </button>
  );
}

function TypePill({ type }: { type: ProcurementType }) {
  return (
    <span className={cn("inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium", TYPE_STYLE[type].badge)}>
      {type}
    </span>
  );
}

function HealthBadge({ health }: { health: ProjectHealth }) {
  const style = READ_STATUS_STYLE[health.status] ?? READ_STATUS_STYLE["ไม่มีข้อมูล"];
  return (
    <span className="inline-flex flex-col items-center gap-0.5">
      <span
        title={health.summary}
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
          style.badge
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
        {health.status}
      </span>
      {health.counts.total > 0 && (
        <span className="text-[10px] text-slate-400" title={health.accessSummary}>
          เข้าถึง {health.counts.accessible}/{health.counts.total}
          {health.counts.ocrOk > 0 && (
            <span className="text-teal-500"> · OCR {health.counts.ocrOk}</span>
          )}
        </span>
      )}
    </span>
  );
}

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={cn("text-[10px]", active ? "text-brand-600" : "text-slate-300")}>
      {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

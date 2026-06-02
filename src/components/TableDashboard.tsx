"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ProcurementType, Project } from "@/types";
import {
  BUDGET_ORDER,
  BUDGET_SHORT,
  PROCUREMENT_TYPES,
  TYPE_STYLE,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

type SortKey = "order" | "type" | "budgetRange" | "code" | "name" | "fileCount";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string; align?: "center" }[] = [
  { key: "order", label: "ลำดับ", align: "center" },
  { key: "type", label: "ประเภท" },
  { key: "budgetRange", label: "ช่วงวงเงิน" },
  { key: "code", label: "รหัสโครงการ" },
  { key: "name", label: "ชื่อโครงการ" },
  { key: "fileCount", label: "ไฟล์", align: "center" },
];

export function TableDashboard({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [types, setTypes] = useState<Set<ProcurementType>>(new Set());
  const [budgets, setBudgets] = useState<Set<string>>(new Set());
  const [onlyTor, setOnlyTor] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("order");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = projects.filter((p) => {
      const matchQuery =
        !q || p.name.toLowerCase().includes(q) || p.code.includes(q);
      const matchType = types.size === 0 || types.has(p.type);
      const matchBudget = budgets.size === 0 || budgets.has(p.budgetRange);
      const matchTor = !onlyTor || p.torFiles.length > 0;
      return matchQuery && matchType && matchBudget && matchTor;
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
          return a[sortKey].localeCompare(b[sortKey], "th") * dir;
        case "code":
          return a.code.localeCompare(b.code) * dir;
        case "fileCount":
          return (a.fileCount - b.fileCount) * dir;
        default:
          return (a.order - b.order) * dir;
      }
    });
  }, [projects, query, types, budgets, onlyTor, sortKey, sortDir]);

  function toggleSet<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    next.has(value) ? next.delete(value) : next.add(value);
    return next;
  }

  function onSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function clearFilters() {
    setQuery("");
    setTypes(new Set());
    setBudgets(new Set());
    setOnlyTor(false);
  }

  function exportCsv() {
    const header = [
      "ลำดับ",
      "ประเภท",
      "ช่วงวงเงิน",
      "รหัสโครงการ",
      "ชื่อโครงการ",
      "จำนวนไฟล์",
      "รายชื่อไฟล์",
    ];
    const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
    const lines = filtered.map((p) =>
      [
        p.order,
        p.type,
        p.budgetRange,
        p.code,
        p.name,
        p.fileCount,
        p.files.join(" | "),
      ]
        .map(escape)
        .join(",")
    );
    // ﻿ = BOM ให้ Excel อ่านภาษาไทยถูก
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
    query.trim() !== "" || types.size > 0 || budgets.size > 0 || onlyTor;

  return (
    <div className="space-y-4">
      {/* แถบฟิลเตอร์ */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        {/* ค้นหา */}
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหาชื่อโครงการ หรือรหัสโครงการ…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-3 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {/* ประเภท */}
        <FilterRow label="ประเภท">
          {PROCUREMENT_TYPES.map((t) => (
            <Chip
              key={t}
              active={types.has(t)}
              onClick={() => setTypes((s) => toggleSet(s, t))}
              className={types.has(t) ? "" : TYPE_STYLE[t].badge}
            >
              {t}
            </Chip>
          ))}
        </FilterRow>

        {/* ช่วงวงเงิน */}
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

        {/* ตัวเลือกเพิ่ม + ปุ่ม */}
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
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="M7 10l5 5 5-5M12 15V3" />
              </svg>
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* ตาราง */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[820px] text-sm">
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
                  <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium", TYPE_STYLE[p.type].badge)}>
                    {p.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600" title={p.budgetRange}>
                  {BUDGET_SHORT[p.budgetRange] ?? p.budgetRange}
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
    </div>
  );
}

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

function SortIndicator({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={cn("text-[10px]", active ? "text-brand-600" : "text-slate-300")}>
      {active ? (dir === "asc" ? "▲" : "▼") : "↕"}
    </span>
  );
}

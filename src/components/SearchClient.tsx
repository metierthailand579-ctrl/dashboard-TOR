"use client";

import { useMemo, useState } from "react";
import type { ProcurementType, Project } from "@/types";
import { PROCUREMENT_TYPES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { ProjectCard } from "@/components/ProjectCard";

export function SearchClient({ projects }: { projects: Project[] }) {
  const [query, setQuery] = useState("");
  const [activeType, setActiveType] = useState<ProcurementType | "ทั้งหมด">("ทั้งหมด");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      const matchType = activeType === "ทั้งหมด" || p.type === activeType;
      const matchQuery =
        !q || p.name.toLowerCase().includes(q) || p.code.includes(q);
      return matchType && matchQuery;
    });
  }, [projects, query, activeType]);

  return (
    <div>
      <div className="relative mb-4">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          placeholder="ค้นหาด้วยชื่อโครงการ หรือรหัสโครงการ…"
          className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {(["ทั้งหมด", ...PROCUREMENT_TYPES] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveType(t)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition",
              activeType === t
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <p className="mb-3 text-sm text-slate-500">
        พบ <span className="font-semibold text-slate-700">{results.length}</span> โครงการ
      </p>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center text-slate-400">
          ไม่พบโครงการที่ตรงกับเงื่อนไข
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {results.map((p) => (
            <ProjectCard key={p.code} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

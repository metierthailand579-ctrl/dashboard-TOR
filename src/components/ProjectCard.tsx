import Link from "next/link";
import type { Project } from "@/types";
import { TYPE_STYLE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { TypeBadge } from "@/components/TypeBadge";
import { BudgetChip } from "@/components/BudgetChip";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/project/${project.code}`}
      className={cn(
        "group block rounded-xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-slate-300",
        TYPE_STYLE[project.type].accent
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <TypeBadge type={project.type} />
        <BudgetChip budget={project.budgetRange} />
        <span className="ml-auto font-mono text-xs text-slate-400">{project.code}</span>
      </div>
      <h3
        className="line-clamp-2 text-sm font-medium leading-relaxed text-slate-800 group-hover:text-brand-700"
        title={project.name}
      >
        {project.name}
      </h3>
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <FileIcon /> {project.fileCount} ไฟล์
        </span>
        {project.torFiles.length > 0 && (
          <span className="inline-flex items-center gap-1 text-brand-600">
            TOR {project.torFiles.length} ฉบับ
          </span>
        )}
      </div>
    </Link>
  );
}

function FileIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

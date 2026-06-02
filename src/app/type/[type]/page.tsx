import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjectsByType } from "@/lib/data";
import { SLUG_TO_TYPE, TYPE_TO_SLUG, BUDGET_SHORT } from "@/lib/constants";
import { groupByBudget } from "@/lib/utils";
import { ProjectCard } from "@/components/ProjectCard";
import { TypeBadge } from "@/components/TypeBadge";

type Params = { params: { type: string } };

export function generateStaticParams() {
  return Object.values(TYPE_TO_SLUG).map((type) => ({ type }));
}

export function generateMetadata({ params }: Params): Metadata {
  const type = SLUG_TO_TYPE[params.type];
  if (!type) return { title: "ไม่พบประเภท" };
  return { title: type, description: `รายการโครงการประเภท${type}` };
}

export default function TypePage({ params }: Params) {
  const type = SLUG_TO_TYPE[params.type];
  if (!type) notFound();

  const projects = getProjectsByType(type);
  const groups = groupByBudget(projects);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold text-slate-800">ประเภท</h1>
        <TypeBadge type={type} className="text-sm" />
        <span className="text-sm text-slate-400">{projects.length} โครงการ</span>
      </div>

      {groups.map(([budget, items]) => (
        <section key={budget}>
          <div className="mb-3 flex items-center gap-2 border-b border-slate-200 pb-2">
            <h2 className="font-semibold text-slate-700">{budget}</h2>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {items.length} โครงการ · {BUDGET_SHORT[budget] ?? ""}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((p) => (
              <ProjectCard key={p.code} project={p} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

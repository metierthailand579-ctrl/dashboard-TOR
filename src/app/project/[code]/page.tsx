import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAllProjects, getProjectByCode, getProjectHealth } from "@/lib/data";
import {
  ACCESS_STATUS_STYLE,
  OCR_STYLE,
  READ_STATUS_STYLE,
  TYPE_TO_SLUG,
} from "@/lib/constants";
import { cn, fileUrl, isTorFile } from "@/lib/utils";
import { TypeBadge } from "@/components/TypeBadge";
import { BudgetChip } from "@/components/BudgetChip";

type Params = { params: { code: string } };

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ code: p.code }));
}

export function generateMetadata({ params }: Params): Metadata {
  const project = getProjectByCode(params.code);
  if (!project) return { title: "ไม่พบโครงการ" };
  return {
    title: project.name,
    description: `โครงการ${project.type} วงเงิน${project.budgetRange} · ${project.fileCount} ไฟล์เอกสาร`,
  };
}

export default function ProjectPage({ params }: Params) {
  const project = getProjectByCode(params.code);
  if (!project) notFound();

  const health = getProjectHealth(project.code);
  const fileStatus = new Map(health.files.map((f) => [f.name, f]));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-400">
        <Link href="/" className="hover:text-slate-600">
          หน้าแรก
        </Link>
        <span>/</span>
        <Link href={`/type/${TYPE_TO_SLUG[project.type]}`} className="hover:text-slate-600">
          {project.type}
        </Link>
        <span>/</span>
        <span className="font-mono text-slate-500">{project.code}</span>
      </nav>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <TypeBadge type={project.type} />
          <BudgetChip budget={project.budgetRange} />
        </div>
        <h1 className="text-lg font-bold leading-relaxed text-slate-800">{project.name}</h1>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
          <Field label="รหัสโครงการ" value={project.code} mono />
          <Field label="กลุ่มงาน" value={`${project.workGroup} · ${project.workSubGroup}`} />
          <Field
            label="โอกาสธุรกิจ Metier"
            value={
              project.metierGroup === "NOT_APPLICABLE"
                ? "ไม่ใช่โอกาส"
                : `${project.metierGroup} · ${project.metierSubGroup}`
            }
          />
          <Field label="ช่วงวงเงิน" value={project.budgetRange} />
          <Field label="จำนวนไฟล์" value={`${project.fileCount} ไฟล์`} />
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-slate-400">สถานะการอ่าน TOR</dt>
            <dd className="mt-0.5">
              <StatusBadge status={health.status} />
              {health.counts.total > 0 && (
                <span className="ml-2 text-xs text-slate-400">{health.summary}</span>
              )}
            </dd>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <dt className="text-xs text-slate-400">การเข้าถึงข้อความ (รวม OCR)</dt>
            <dd className="mt-0.5">
              <StatusBadge status={health.accessStatus} />
              {health.counts.total > 0 && (
                <span className="ml-2 text-xs text-slate-400">{health.accessSummary}</span>
              )}
            </dd>
          </div>
        </dl>
      </header>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-700">
          เอกสารแนบ ({project.files.length})
        </h2>
        <ul className="space-y-2">
          {project.files.map((file) => (
            <li
              key={file}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-500">
                <PdfIcon />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-slate-700" title={file}>
                  {file}
                </p>
                <span className="flex flex-wrap items-center gap-x-2 text-xs">
                  {isTorFile(file) && (
                    <span className="font-medium text-brand-600">เอกสาร TOR</span>
                  )}
                  {fileStatus.get(file) && (
                    <>
                      <StatusBadge status={fileStatus.get(file)!.status} />
                      {OCR_STYLE[fileStatus.get(file)!.ocr] && (
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 font-medium",
                            OCR_STYLE[fileStatus.get(file)!.ocr]
                          )}
                        >
                          {fileStatus.get(file)!.ocr}
                        </span>
                      )}
                      <span className="text-slate-400">{fileStatus.get(file)!.detail}</span>
                    </>
                  )}
                </span>
              </div>
              <a
                href={fileUrl(project.code, file)}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-md px-3 py-1.5 text-sm text-brand-600 transition hover:bg-brand-50"
              >
                เปิด
              </a>
              <a
                href={fileUrl(project.code, file)}
                download
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white transition hover:bg-brand-700"
              >
                ดาวน์โหลด
              </a>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-slate-400">
          * ไฟล์เอกสารต้องวางไว้ที่ <code className="rounded bg-slate-100 px-1">public/docs/{project.code}/</code>
        </p>
      </section>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className={mono ? "font-mono text-slate-700" : "text-slate-700"}>{value}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style =
    READ_STATUS_STYLE[status] ??
    ACCESS_STATUS_STYLE[status] ??
    READ_STATUS_STYLE["ไม่มีข้อมูล"];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        style.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  );
}

function PdfIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}

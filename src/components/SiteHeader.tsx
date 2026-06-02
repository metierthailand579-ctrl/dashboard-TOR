import Link from "next/link";
import { PROCUREMENT_TYPES, TYPE_TO_SLUG } from "@/lib/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
            TOR
          </span>
          <span className="text-sm sm:text-base">ระบบเอกสารจัดซื้อจัดจ้าง</span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1 text-sm">
          <Link
            href="/summary"
            className="rounded-md px-2.5 py-1 font-medium text-brand-700 transition hover:bg-brand-50"
          >
            สรุปภาพรวม
          </Link>
          <Link
            href="/table"
            className="rounded-md px-2.5 py-1 font-medium text-brand-700 transition hover:bg-brand-50"
          >
            ตารางข้อมูล
          </Link>
          {PROCUREMENT_TYPES.map((type) => (
            <Link
              key={type}
              href={`/type/${TYPE_TO_SLUG[type]}`}
              className="rounded-md px-2.5 py-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              {type}
            </Link>
          ))}
        </nav>

        <Link
          href="/search"
          className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
        >
          <SearchIcon /> ค้นหา
        </Link>
      </div>
    </header>
  );
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

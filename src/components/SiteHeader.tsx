"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROCUREMENT_TYPES, TYPE_TO_SLUG } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();

  // ลิงก์ active เมื่อ path ตรง หรือเป็น path ย่อย
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

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
          <NavLink href="/summary" active={isActive("/summary")} primary>
            สรุปภาพรวม
          </NavLink>
          <NavLink href="/table" active={isActive("/table")} primary>
            ตารางข้อมูล
          </NavLink>
          {PROCUREMENT_TYPES.map((type) => {
            const href = `/type/${TYPE_TO_SLUG[type]}`;
            return (
              <NavLink key={type} href={href} active={isActive(href)}>
                {type}
              </NavLink>
            );
          })}
        </nav>

        <Link
          href="/search"
          aria-current={isActive("/search") ? "page" : undefined}
          className={cn(
            "ml-auto inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition",
            isActive("/search")
              ? "border-brand-600 bg-brand-600 text-white"
              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900"
          )}
        >
          <SearchIcon /> ค้นหา
        </Link>
      </div>
    </header>
  );
}

function NavLink({
  href,
  active,
  primary,
  children,
}: {
  href: string;
  active: boolean;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "rounded-md px-2.5 py-1 font-medium transition",
        active
          ? "bg-brand-600 text-white shadow-sm"
          : primary
            ? "text-brand-700 hover:bg-brand-50"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      )}
    >
      {children}
    </Link>
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

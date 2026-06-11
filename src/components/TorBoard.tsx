"use client";

import { useEffect, useMemo, useState } from "react";
import type { TorItem, TorStatus } from "@/types";
import { TOR_STATUS_ORDER, TOR_STATUS_STYLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "tor-status-v1";

/** อ่าน override สถานะที่ผู้ใช้บันทึกไว้ใน browser */
function loadOverrides(): Record<string, TorStatus> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    const valid: Record<string, TorStatus> = {};
    for (const [k, v] of Object.entries(parsed)) {
      if ((TOR_STATUS_ORDER as string[]).includes(v)) valid[k] = v as TorStatus;
    }
    return valid;
  } catch {
    return {};
  }
}

export function TorBoard({ items }: { items: TorItem[] }) {
  // สถานะเริ่มต้นจาก Excel — sync จาก localStorage หลัง mount (เลี่ยง hydration mismatch)
  const [statuses, setStatuses] = useState<Record<string, TorStatus>>(() =>
    Object.fromEntries(items.map((it) => [it.name, it.status]))
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const overrides = loadOverrides();
    setStatuses((prev) => ({ ...prev, ...overrides }));
    setHydrated(true);
  }, []);

  function setStatus(name: string, status: TorStatus) {
    setStatuses((prev) => {
      const next = { ...prev, [name]: status };
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        /* localStorage เต็ม/ปิด — ข้าม (ค่ายังอยู่ใน state) */
      }
      return next;
    });
  }

  function resetAll() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setStatuses(Object.fromEntries(items.map((it) => [it.name, it.status])));
  }

  // สรุปจำนวนต่อสถานะ + ความคืบหน้า (เสร็จสมบูรณ์ / ทั้งหมด)
  const counts = useMemo(() => {
    const c: Record<TorStatus, number> = {
      "to do": 0,
      "skill.md": 0,
      วางโครงร่างTOR: 0,
      "TOR เสร็จสมบูรณ์": 0,
    };
    for (const it of items) c[statuses[it.name] ?? it.status]++;
    return c;
  }, [items, statuses]);

  const done = counts["TOR เสร็จสมบูรณ์"];
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;
  const isDirty = useMemo(
    () => items.some((it) => (statuses[it.name] ?? it.status) !== it.status),
    [items, statuses]
  );

  return (
    <div className="space-y-5">
      {/* สรุป + ความคืบหน้า */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-500">สรุปสถานะ</span>
          {TOR_STATUS_ORDER.map((s) => (
            <span
              key={s}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                TOR_STATUS_STYLE[s].badge
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", TOR_STATUS_STYLE[s].dot)} />
              {s}
              <span className="font-semibold">{counts[s]}</span>
            </span>
          ))}
          <span className="ml-auto text-sm text-slate-500">
            เสร็จสมบูรณ์{" "}
            <span className="font-semibold text-emerald-600">{done}</span> / {items.length} โครงการ
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* ตารางงานจัดทำ TOR */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="w-14 px-4 py-3 text-center font-medium">ลำดับ</th>
              <th className="px-4 py-3 font-medium">โครงการ</th>
              <th className="w-28 px-4 py-3 text-center font-medium">จำนวน TOR</th>
              <th className="w-56 px-4 py-3 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const status = statuses[it.name] ?? it.status;
              return (
                <tr
                  key={it.name}
                  className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
                >
                  <td className="px-4 py-3 text-center text-slate-400">{it.order}</td>
                  <td className="px-4 py-3 text-slate-700">{it.name}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {it.torCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusSelect
                      value={status}
                      onChange={(s) => setStatus(it.name, s)}
                      disabled={!hydrated}
                    />
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                  ไม่มีงานจัดทำ TOR ในชีต
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-400">
        <span>สถานะที่เลือกถูกบันทึกในเบราว์เซอร์ของคุณ (localStorage)</span>
        {isDirty && (
          <button
            onClick={resetAll}
            className="text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline"
          >
            รีเซ็ตเป็นค่าเริ่มต้น
          </button>
        )}
      </div>
    </div>
  );
}

/** dropdown เลือกสถานะ — สีตามสถานะปัจจุบัน */
function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: TorStatus;
  onChange: (s: TorStatus) => void;
  disabled?: boolean;
}) {
  const style = TOR_STATUS_STYLE[value];
  return (
    <div className="relative inline-flex w-full items-center">
      <span
        className={cn(
          "pointer-events-none absolute left-3 h-2 w-2 rounded-full",
          style.dot
        )}
      />
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value as TorStatus)}
        className={cn(
          "w-full appearance-none rounded-lg border bg-white py-2 pl-7 pr-8 text-sm font-medium text-slate-700 outline-none transition focus:ring-2 disabled:opacity-50",
          style.ring
        )}
      >
        {TOR_STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-2.5 h-4 w-4 text-slate-400"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

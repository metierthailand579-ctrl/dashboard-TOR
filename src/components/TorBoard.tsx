import type { TorItem, TorStatus } from "@/types";
import { TOR_STATUS_ORDER, TOR_STATUS_STYLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TorBoard({ items }: { items: TorItem[] }) {
  // สรุปจำนวนต่อสถานะ + ความคืบหน้า (อ่านสถานะจาก Excel ตรง ๆ)
  const counts: Record<TorStatus, number> = {
    "to do": 0,
    "skill.md": 0,
    วางโครงร่างTOR: 0,
    "TOR เสร็จสมบูรณ์": 0,
  };
  for (const it of items) counts[it.status]++;

  const totalTor = items.reduce((sum, it) => sum + it.torCount, 0);
  const done = counts["TOR เสร็จสมบูรณ์"];
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

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
            <span className="font-semibold text-emerald-600">{done}</span> / {items.length} หมวด
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
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-slate-500">
              <th className="w-14 px-4 py-3 text-center font-medium">ลำดับ</th>
              <th className="px-4 py-3 font-medium">หมวดงาน</th>
              <th className="w-28 px-4 py-3 text-center font-medium">จำนวน TOR</th>
              <th className="w-48 px-4 py-3 font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr
                key={it.name}
                className="border-b border-slate-100 transition last:border-0 hover:bg-slate-50"
              >
                <td className="px-4 py-3 text-center text-slate-400">{it.order}</td>
                <td className="px-4 py-3 font-medium text-slate-700">{it.name}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    {it.torCount}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={it.status} />
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                  ไม่มีงานจัดทำ TOR ในชีต
                </td>
              </tr>
            )}
          </tbody>
          {items.length > 0 && (
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50 font-medium text-slate-600">
                <td className="px-4 py-3" />
                <td className="px-4 py-3 text-right">รวม</td>
                <td className="px-4 py-3 text-center">{totalTor}</td>
                <td className="px-4 py-3" />
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <p className="text-xs text-slate-400">
        สถานะอ่านจากชีต “TOR” ในไฟล์ Excel โดยตรง — แก้ไขสถานะที่ Excel แล้วรัน{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-[11px]">npm run build:data</code>
      </p>
    </div>
  );
}

/** ป้ายแสดงสถานะ (อ่านอย่างเดียว) — สีตามสถานะ */
function StatusBadge({ status }: { status: TorStatus }) {
  const style = TOR_STATUS_STYLE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        style.badge
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  );
}

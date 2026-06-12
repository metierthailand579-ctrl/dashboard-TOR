import { Fragment } from "react";
import type { TorItem, TorStatus } from "@/types";
import { METIER_STYLE, TOR_STATUS_STYLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TorBoard({ items }: { items: TorItem[] }) {
  const totalTor = items.reduce((sum, it) => sum + it.torCount, 0);

  return (
    <div className="space-y-5">
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
            {items.map((it) => {
              const subGroups = it.subGroups ?? [];
              const metierStyle = METIER_STYLE[it.name];
              return (
                <Fragment key={it.name}>
                  <tr
                    className={cn(
                      "border-b border-slate-100 transition hover:bg-slate-50",
                      subGroups.length > 0 && "bg-amber-50/40"
                    )}
                  >
                    <td className="px-4 py-3 text-center text-slate-400">{it.order}</td>
                    <td className="px-4 py-3 font-medium text-slate-700">
                      <span className="inline-flex items-center gap-2">
                        {metierStyle && (
                          <span className={cn("h-2 w-2 rounded-full", metierStyle.dot)} />
                        )}
                        {it.name}
                        {subGroups.length > 0 && (
                          <span className="text-xs font-normal text-slate-400">
                            ({subGroups.length} กลุ่มย่อย)
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {it.torCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={it.status} />
                    </td>
                  </tr>
                  {subGroups.map((sub, i) => (
                    <tr
                      key={`${it.name}—${sub.name}`}
                      className="border-b border-slate-100 bg-amber-50/20 text-slate-600 transition last:border-0 hover:bg-amber-50/40"
                    >
                      <td className="px-4 py-2" />
                      <td className="px-4 py-2 text-sm">
                        <span className="inline-flex items-center gap-2 pl-4">
                          <span className="font-mono text-xs text-slate-300">
                            {i === subGroups.length - 1 ? "└─" : "├─"}
                          </span>
                          {sub.name}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="inline-flex items-center rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-500 ring-1 ring-slate-200">
                          {sub.projectCount} โครงการ
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={it.status} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
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
        <br />
        หมวด Metier (Software/Creative/Media/Marketing) แตกกลุ่มย่อยจากการจัดกลุ่มโครงการ —
        ตัวเลข “โครงการ” ของกลุ่มย่อยคือจำนวนโครงการ (อาจต่างจาก “จำนวน TOR” ของหมวด)
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

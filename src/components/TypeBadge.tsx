import type { ProcurementType } from "@/types";
import { TYPE_STYLE } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function TypeBadge({ type, className }: { type: ProcurementType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        TYPE_STYLE[type].badge,
        className
      )}
    >
      {type}
    </span>
  );
}

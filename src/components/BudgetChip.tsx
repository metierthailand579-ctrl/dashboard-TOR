import { BUDGET_SHORT } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function BudgetChip({ budget, className }: { budget: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600",
        className
      )}
      title={budget}
    >
      {BUDGET_SHORT[budget] ?? budget}
    </span>
  );
}

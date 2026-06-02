import type { Project } from "@/types";
import { BUDGET_ORDER } from "@/lib/constants";

/** path ของไฟล์เอกสารใน public (วางไฟล์จริงไว้ที่ public/docs/<code>/) */
export function fileUrl(code: string, file: string): string {
  return `/docs/${code}/${encodeURIComponent(file)}`;
}

/** เดาว่าไฟล์เป็น TOR หลักหรือไม่ (ใช้เน้นปุ่ม) */
export function isTorFile(file: string): boolean {
  return /tor/i.test(file);
}

/** จัดกลุ่มโครงการตามช่วงวงเงิน เรียงตามลำดับมาตรฐาน */
export function groupByBudget(projects: Project[]): [string, Project[]][] {
  const map = new Map<string, Project[]>();
  for (const p of projects) {
    const arr = map.get(p.budgetRange) ?? [];
    arr.push(p);
    map.set(p.budgetRange, arr);
  }
  return Array.from(map.entries()).sort(
    (a, b) => BUDGET_ORDER.indexOf(a[0]) - BUDGET_ORDER.indexOf(b[0])
  );
}

/** รวม class แบบมีเงื่อนไข */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

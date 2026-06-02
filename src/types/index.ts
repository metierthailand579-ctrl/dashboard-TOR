/** ประเภทการจัดซื้อจัดจ้าง */
export type ProcurementType = "ซื้อ" | "เช่า" | "จ้างก่อสร้าง" | "จ้างเหมาบริการ";

/** โครงการจัดซื้อจัดจ้าง 1 รายการ (ตรงกับชีต "รายการโครงการทั้งหมด") */
export interface Project {
  order: number;
  type: ProcurementType;
  budgetRange: string;
  code: string;
  name: string;
  fileCount: number;
  fileTypes: string[];
  files: string[];
  torFiles: string[];
}

/** แถวสรุปจากชีต "ภาพรวม" (ประเภท × ช่วงวงเงิน) */
export interface OverviewRow {
  type: ProcurementType;
  budgetRange: string;
  projectCount: number;
  fileCount: number;
}

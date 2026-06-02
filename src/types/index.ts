/** ประเภทการจัดซื้อจัดจ้าง */
export type ProcurementType = "ซื้อ" | "เช่า" | "จ้างก่อสร้าง" | "จ้างเหมาบริการ";

/** โครงการจัดซื้อจัดจ้าง 1 รายการ (ตรงกับชีต "รายการโครงการทั้งหมด") */
export interface Project {
  order: number;
  type: ProcurementType;
  budgetRange: string;
  code: string;
  name: string;
  /** หมวดพัสดุกว้าง (สกัดจากชื่อโครงการ) */
  group: string;
  /** หมวดย่อย/รายละเอียดพัสดุ (สกัดจากชื่อโครงการ) */
  subGroup: string;
  fileCount: number;
  fileTypes: string[];
  files: string[];
  torFiles: string[];
}

/** สถานะการอ่านไฟล์ระดับไฟล์ (ตามที่บันทึกใน Excel) */
export type FileReadStatus = "อ่านได้" | "ต้อง OCR" | "อ่านไม่ได้";

/** สถานะการอ่านระดับโครงการ (รวมจากไฟล์ทั้งหมด) */
export type HealthStatus =
  | "อ่านได้"
  | "อ่านได้บางส่วน"
  | "ต้อง OCR"
  | "อ่านไม่ได้"
  | "ไม่มีข้อมูล";

/** ผลตรวจไฟล์ TOR รายไฟล์ */
export interface FileHealth {
  name: string;
  status: FileReadStatus | string;
  sizeKB: number | null;
  detail: string;
}

/** จำนวนไฟล์แต่ละสถานะ */
export interface HealthCounts {
  readable: number;
  ocr: number;
  unreadable: number;
  total: number;
}

/** ผลตรวจ health ต่อโครงการ */
export interface ProjectHealth {
  status: HealthStatus;
  /** สรุปข้อความ เช่น "อ่านได้:2 / ต้อง OCR:4" */
  summary: string;
  counts: HealthCounts;
  files: FileHealth[];
}

/** โครงการ + ผลตรวจ health (ใช้ในตาราง) */
export interface ProjectWithHealth extends Project {
  health: ProjectHealth;
}

/** แถวสรุปจากชีต "ภาพรวม" (ประเภท × ช่วงวงเงิน) */
export interface OverviewRow {
  type: ProcurementType;
  budgetRange: string;
  projectCount: number;
  fileCount: number;
}

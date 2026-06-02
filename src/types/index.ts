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

/** สถานะการอ่านไฟล์ TOR */
export type HealthStatus = "Read" | "Can't Read";

/** ผลตรวจไฟล์ TOR รายไฟล์ */
export interface FileHealth {
  name: string;
  status: "ok" | "no_text" | "corrupt" | "missing";
  reason: string;
}

/** ผลตรวจ health ต่อโครงการ */
export interface ProjectHealth {
  status: HealthStatus;
  reason: string;
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

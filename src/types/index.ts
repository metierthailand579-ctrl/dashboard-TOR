/** ประเภทการจัดซื้อจัดจ้าง */
export type ProcurementType = "ซื้อ" | "เช่า" | "จ้างก่อสร้าง" | "จ้างเหมาบริการ";

/** โครงการจัดซื้อจัดจ้าง 1 รายการ (ตรงกับชีต "รายการโครงการทั้งหมด") */
export interface Project {
  order: number;
  type: ProcurementType;
  budgetRange: string;
  code: string;
  name: string;
  /** กลุ่มหลัก (work_category) = workGroup */
  group: string;
  /** กลุ่มย่อย = workSubGroup */
  subGroup: string;
  /** กลุ่มงาน (เหมือน group/subGroup) */
  workGroup: string;
  workSubGroup: string;
  /** โอกาสธุรกิจ Metier (derive จากกลุ่มที่ไม่ขึ้นต้นด้วยเลข; NOT_APPLICABLE = ไม่ใช่โอกาส) */
  metierGroup: string;
  metierSubGroup: string;
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

/** สถานะการเข้าถึงข้อความ (รวมผล OCR แล้ว) */
export type AccessStatus =
  | "เข้าถึงได้ทั้งหมด"
  | "เข้าถึงได้บางส่วน"
  | "เข้าถึงไม่ได้"
  | "ไม่มีข้อมูล";

/** ผลตรวจไฟล์ TOR รายไฟล์ */
export interface FileHealth {
  name: string;
  status: FileReadStatus | string;
  /** ผล OCR เช่น "OCR อ่านได้" / "— (มี text อยู่แล้ว)" */
  ocr: string;
  sizeKB: number | null;
  detail: string;
  /** เข้าถึงข้อความได้ (มี text หรือ OCR สำเร็จ) */
  accessible: boolean;
}

/** จำนวนไฟล์แต่ละสถานะ */
export interface HealthCounts {
  readable: number;
  ocr: number;
  unreadable: number;
  ocrOk: number;
  ocrFail: number;
  /** เข้าถึงข้อความได้ = readable + ocrOk */
  accessible: number;
  total: number;
}

/** ผลตรวจ health ต่อโครงการ */
export interface ProjectHealth {
  status: HealthStatus;
  /** สรุปข้อความ เช่น "อ่านได้:2 / ต้อง OCR:4" */
  summary: string;
  accessStatus: AccessStatus;
  accessSummary: string;
  counts: HealthCounts;
  files: FileHealth[];
}

/** สรุปการเข้าถึงข้อความระดับไฟล์ทั้งระบบ */
export interface FileSummary {
  textReady: number;
  ocrOk: number;
  ocrFail: number;
  corrupt: number;
  accessible: number;
  total: number;
}

/** โครงการ + ผลตรวจ health (ใช้ในตาราง) */
export interface ProjectWithHealth extends Project {
  health: ProjectHealth;
}

/** สถานะการจัดทำ TOR (workflow) ตามชีต "TOR" */
export type TorStatus = "to do" | "skill.md" | "วางโครงร่างTOR" | "TOR เสร็จสมบูรณ์";

/** งานจัดทำ TOR 1 รายการ (ตรงกับชีต "TOR") */
export interface TorItem {
  order: number;
  name: string;
  /** จำนวน TOR ที่ต้องจัดทำในโครงการนี้ */
  torCount: number;
  /** สถานะเริ่มต้นจาก Excel (ผู้ใช้เปลี่ยน/บันทึกในเว็บผ่าน localStorage) */
  status: TorStatus;
}

/** แถวสรุปจากชีต "ภาพรวม" (ประเภท × ช่วงวงเงิน) */
export interface OverviewRow {
  type: ProcurementType;
  budgetRange: string;
  projectCount: number;
  fileCount: number;
}

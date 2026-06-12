import type { ProcurementType, TorStatus } from "@/types";

/** ประเภททั้งหมด เรียงตามที่ต้องการแสดง */
export const PROCUREMENT_TYPES: ProcurementType[] = [
  "ซื้อ",
  "เช่า",
  "จ้างก่อสร้าง",
  "จ้างเหมาบริการ",
];

/** slug ภาษาอังกฤษสำหรับ URL (เลี่ยงอักษรไทยใน path) */
export const TYPE_TO_SLUG: Record<ProcurementType, string> = {
  ซื้อ: "buy",
  เช่า: "rent",
  จ้างก่อสร้าง: "construction",
  จ้างเหมาบริการ: "service",
};

export const SLUG_TO_TYPE: Record<string, ProcurementType> = Object.fromEntries(
  Object.entries(TYPE_TO_SLUG).map(([type, slug]) => [slug, type as ProcurementType])
) as Record<string, ProcurementType>;

/** สีประจำประเภท (Tailwind classes) */
export const TYPE_STYLE: Record<ProcurementType, { badge: string; accent: string }> = {
  ซื้อ: { badge: "bg-blue-100 text-blue-700", accent: "border-blue-500" },
  เช่า: { badge: "bg-emerald-100 text-emerald-700", accent: "border-emerald-500" },
  จ้างก่อสร้าง: { badge: "bg-amber-100 text-amber-700", accent: "border-amber-500" },
  จ้างเหมาบริการ: { badge: "bg-purple-100 text-purple-700", accent: "border-purple-500" },
};

/** ช่วงวงเงิน เรียงจากน้อยไปมาก (ใช้จัดลำดับ filter) */
export const BUDGET_ORDER = [
  "ไม่เกิน 500,000 บาท",
  "มากกว่า 500,000 ถึง 5,000,000 บาท",
  "มากกว่า 5,000,000 ถึง 500,000,000 บาท",
  "มากกว่า 500,000,000 บาท",
];

/** สถานะการอ่าน TOR เรียงตามลำดับการแสดง */
export const READ_STATUS_ORDER = [
  "อ่านได้",
  "อ่านได้บางส่วน",
  "ต้อง OCR",
  "อ่านไม่ได้",
  "ไม่มีข้อมูล",
] as const;

/** สีประจำสถานะการอ่าน */
export const READ_STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  อ่านได้: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  อ่านได้บางส่วน: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  "ต้อง OCR": { badge: "bg-orange-100 text-orange-700", dot: "bg-orange-500" },
  อ่านไม่ได้: { badge: "bg-red-100 text-red-600", dot: "bg-red-500" },
  ไม่มีข้อมูล: { badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

/** สีประจำสถานะการเข้าถึงข้อความ (รวม OCR) */
export const ACCESS_STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
  เข้าถึงได้ทั้งหมด: { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  เข้าถึงได้บางส่วน: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  เข้าถึงไม่ได้: { badge: "bg-red-100 text-red-600", dot: "bg-red-500" },
  ไม่มีข้อมูล: { badge: "bg-slate-100 text-slate-500", dot: "bg-slate-400" },
};

/** Metier: ค่าที่ไม่ใช่โอกาสธุรกิจ */
export const METIER_NA = "NOT_APPLICABLE";

/** กลุ่ม Metier ทั้งหมด (canonical, เรียงตามลำดับแสดง) — ระบุในระบบเสมอแม้ไม่มีโครงการในกลุ่ม */
export const METIER_GROUPS = [
  "Software Metier",
  "Creative Metier",
  "Media Metier",
  "Marketing Metier",
] as const;

/** ป้ายอ่านง่ายของ Metier กลุ่มหลัก */
export const METIER_LABEL: Record<string, string> = {
  NOT_APPLICABLE: "ไม่ใช่โอกาส",
  "Software Metier": "Software",
  "Creative Metier": "Creative",
  "Media Metier": "Media",
  "Marketing Metier": "Marketing",
};

/** สีประจำ Metier กลุ่มหลัก */
export const METIER_STYLE: Record<string, { badge: string; dot: string }> = {
  "Software Metier": { badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  "Creative Metier": { badge: "bg-pink-100 text-pink-700", dot: "bg-pink-500" },
  "Media Metier": { badge: "bg-cyan-100 text-cyan-700", dot: "bg-cyan-500" },
  "Marketing Metier": { badge: "bg-rose-100 text-rose-700", dot: "bg-rose-500" },
  NOT_APPLICABLE: { badge: "bg-slate-100 text-slate-400", dot: "bg-slate-300" },
};

/** สีผล OCR รายไฟล์ */
export const OCR_STYLE: Record<string, string> = {
  "OCR อ่านได้": "bg-emerald-50 text-emerald-600",
  "OCR อ่านไม่ได้": "bg-red-50 text-red-600",
};

/** สถานะการจัดทำ TOR เรียงตามลำดับ workflow (to do → … → เสร็จสมบูรณ์) */
export const TOR_STATUS_ORDER: TorStatus[] = [
  "to do",
  "skill.md",
  "วางโครงร่างTOR",
  "TOR เสร็จสมบูรณ์",
];

/** สีประจำสถานะการจัดทำ TOR */
export const TOR_STATUS_STYLE: Record<TorStatus, { badge: string; dot: string }> = {
  "to do": { badge: "bg-slate-100 text-slate-600", dot: "bg-slate-400" },
  "skill.md": { badge: "bg-sky-100 text-sky-700", dot: "bg-sky-500" },
  วางโครงร่างTOR: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  "TOR เสร็จสมบูรณ์": { badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
};

/** ป้ายสั้นของช่วงวงเงิน (ใช้ในชิป/ตาราง) */
export const BUDGET_SHORT: Record<string, string> = {
  "ไม่เกิน 500,000 บาท": "≤ 5 แสน",
  "มากกว่า 500,000 ถึง 5,000,000 บาท": "5 แสน–5 ล้าน",
  "มากกว่า 5,000,000 ถึง 500,000,000 บาท": "5 ล้าน–500 ล้าน",
  "มากกว่า 500,000,000 บาท": "> 500 ล้าน",
};

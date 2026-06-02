import "server-only";
import projectsJson from "@data/projects.json";
import overviewJson from "@data/overview.json";
import healthJson from "@data/healthcheck.json";
import type {
  OverviewRow,
  ProcurementType,
  Project,
  ProjectHealth,
  ProjectWithHealth,
} from "@/types";
import { BUDGET_ORDER, PROCUREMENT_TYPES } from "@/lib/constants";

const projects = projectsJson as Project[];
const overview = overviewJson as OverviewRow[];
const health = healthJson as {
  engine: string;
  summary: Record<string, number>;
  projects: Record<string, ProjectHealth>;
};

const UNKNOWN_HEALTH: ProjectHealth = {
  status: "ไม่มีข้อมูล",
  summary: "ไม่มีข้อมูล",
  counts: { readable: 0, ocr: 0, unreadable: 0, total: 0 },
  files: [],
};

/** ผลตรวจ health ของโครงการเดียว */
export function getProjectHealth(code: string): ProjectHealth {
  return health.projects[code] ?? UNKNOWN_HEALTH;
}

/** โครงการทั้งหมดพร้อมผลตรวจ health (สำหรับตาราง) */
export function getProjectsWithHealth(): ProjectWithHealth[] {
  return projects.map((p) => ({
    ...p,
    health: health.projects[p.code] ?? UNKNOWN_HEALTH,
  }));
}

/** สรุปผล health รวม */
export function getHealthSummary() {
  return health.summary;
}

/** โครงการทั้งหมด */
export function getAllProjects(): Project[] {
  return projects;
}

/** ตารางสรุปภาพรวม */
export function getOverview(): OverviewRow[] {
  return overview;
}

/** โครงการตามรหัส */
export function getProjectByCode(code: string): Project | undefined {
  return projects.find((p) => p.code === code);
}

/** โครงการของประเภทหนึ่ง (เรียงตามช่วงวงเงิน → ลำดับ) */
export function getProjectsByType(type: ProcurementType): Project[] {
  return projects
    .filter((p) => p.type === type)
    .sort(
      (a, b) =>
        BUDGET_ORDER.indexOf(a.budgetRange) - BUDGET_ORDER.indexOf(b.budgetRange) ||
        a.order - b.order
    );
}

/** สถิติรวมทั้งระบบ */
export function getStats() {
  const totalFiles = projects.reduce((sum, p) => sum + p.fileCount, 0);
  const byType = PROCUREMENT_TYPES.map((type) => {
    const items = projects.filter((p) => p.type === type);
    return {
      type,
      projectCount: items.length,
      fileCount: items.reduce((sum, p) => sum + p.fileCount, 0),
    };
  });
  return {
    totalProjects: projects.length,
    totalFiles,
    typeCount: PROCUREMENT_TYPES.length,
    byType,
  };
}

/** ค้นหาแบบง่าย: ชื่อหรือรหัสโครงการ (case-insensitive) */
export function searchProjects(query: string): Project[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return projects.filter(
    (p) => p.name.toLowerCase().includes(q) || p.code.includes(q)
  );
}

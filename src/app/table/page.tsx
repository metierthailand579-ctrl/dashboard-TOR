import type { Metadata } from "next";
import { getAllProjects } from "@/lib/data";
import { TableDashboard } from "@/components/TableDashboard";

export const metadata: Metadata = {
  title: "ตารางข้อมูลโครงการ",
  description:
    "ตารางรวมทุกโครงการจัดซื้อจัดจ้าง กรองตามประเภท/ช่วงวงเงิน เรียงทุกคอลัมน์ และส่งออก CSV",
};

export default function TablePage() {
  const projects = getAllProjects();
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-800">ตารางข้อมูลโครงการ</h1>
        <p className="mt-1 text-sm text-slate-500">
          กรองตามเงื่อนไข เรียงลำดับทุกคอลัมน์ และส่งออกเป็น CSV
        </p>
      </div>
      <TableDashboard projects={projects} />
    </div>
  );
}

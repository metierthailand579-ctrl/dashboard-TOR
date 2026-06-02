import type { Metadata } from "next";
import { getAllProjects } from "@/lib/data";
import { SearchClient } from "@/components/SearchClient";

export const metadata: Metadata = {
  title: "ค้นหาโครงการ",
  description: "ค้นหาเอกสาร TOR ด้วยชื่อหรือรหัสโครงการ",
};

export default function SearchPage() {
  const projects = getAllProjects();
  return (
    <div>
      <h1 className="mb-5 text-xl font-bold text-slate-800">ค้นหาโครงการ</h1>
      <SearchClient projects={projects} />
    </div>
  );
}

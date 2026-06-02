import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <p className="text-5xl font-bold text-slate-200">404</p>
      <h1 className="mt-4 text-lg font-semibold text-slate-700">ไม่พบหน้าที่ค้นหา</h1>
      <p className="mt-1 text-sm text-slate-500">
        โครงการหรือประเภทที่ระบุอาจไม่มีอยู่ในระบบ
      </p>
      <Link
        href="/"
        className="mt-6 rounded-md bg-brand-600 px-4 py-2 text-sm text-white transition hover:bg-brand-700"
      >
        กลับหน้าแรก
      </Link>
    </div>
  );
}

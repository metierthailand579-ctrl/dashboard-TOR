#!/usr/bin/env python3
"""แปลง โครงสร้างโฟลเดอร์_รวม_TOR.xlsx -> data/projects.json + data/overview.json

รัน: python3 scripts/build-data.py
อ้างอิง skill: spec-miner (สกัดข้อมูลจากเอกสารต้นทาง)
"""
import json
import os
import re
import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "โครงสร้างโฟลเดอร์_รวม_TOR.xlsx")
OUT = os.path.join(ROOT, "data")


def slug_files(cell):
    return [f.strip() for f in str(cell or "").split("\n") if f.strip()]


def build_projects(ws):
    rows = list(ws.iter_rows(values_only=True))
    projects = []
    for r in rows[1:]:
        if r[0] is None:
            continue
        files = slug_files(r[7])
        ftypes = [t.strip() for t in str(r[6] or "").split(",") if t.strip()]
        # นับไฟล์ TOR (ไฟล์ที่ขึ้นต้น/มีคำว่า tor)
        tor_files = [f for f in files if re.search(r"tor", f, re.IGNORECASE)]
        projects.append({
            "order": r[0],
            "type": (r[1] or "").strip(),
            "budgetRange": (r[2] or "").strip(),
            "code": str(r[3]).strip(),
            "name": (r[4] or "").strip(),
            "fileCount": r[5] or len(files),
            "fileTypes": ftypes,
            "files": files,
            "torFiles": tor_files,
        })
    return projects


def build_overview(ws):
    """ชีตภาพรวม: ประเภท | ช่วงวงเงิน | จำนวนโครงการ | จำนวนไฟล์"""
    rows = list(ws.iter_rows(values_only=True))
    items = []
    current_type = None
    for r in rows:
        a, b, c, d = (r + (None,) * 4)[:4]
        if not isinstance(c, (int, float)):
            # หัวข้อ/หัวตาราง/บรรทัดว่าง
            if a and isinstance(a, str) and a.startswith("ประเภท"):
                continue
            continue
        label = (a or "").strip() if isinstance(a, str) else ""
        if label.startswith("รวม"):
            continue  # ข้ามแถวรวม คำนวณเองทีหลัง
        if label and not label.startswith("รวม"):
            current_type = label
        items.append({
            "type": current_type,
            "budgetRange": (b or "").strip() if isinstance(b, str) else "",
            "projectCount": int(c),
            "fileCount": int(d) if isinstance(d, (int, float)) else 0,
        })
    return items


def main():
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    projects = build_projects(wb["รายการโครงการทั้งหมด"])
    overview = build_overview(wb["ภาพรวม"])

    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "projects.json"), "w", encoding="utf-8") as f:
        json.dump(projects, f, ensure_ascii=False, indent=2)
    with open(os.path.join(OUT, "overview.json"), "w", encoding="utf-8") as f:
        json.dump(overview, f, ensure_ascii=False, indent=2)

    types = sorted(set(p["type"] for p in projects))
    budgets = sorted(set(p["budgetRange"] for p in projects))
    print(f"✓ projects.json: {len(projects)} โครงการ")
    print(f"✓ overview.json: {len(overview)} แถว")
    print(f"  ประเภท: {types}")
    print(f"  ช่วงวงเงิน: {len(budgets)} ช่วง")


if __name__ == "__main__":
    main()

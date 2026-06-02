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


# ---- ตัวสกัด Group / Sub Group จากชื่อโครงการ -------------------------------
# Group = หมวดพัสดุกว้าง, Sub Group = รายละเอียดของพัสดุนั้น
# (heuristic ปรับแก้คำใน GROUPS ได้ตามต้องการ)
GROUPS = [
    ("ครุภัณฑ์คอมพิวเตอร์", ["ครุภัณฑ์คอมพิวเตอร์"]),
    ("คอมพิวเตอร์/ไอที", ["คอมพิวเตอร์", "workstation", "server", "เซิร์ฟเวอร์",
                          "ระบบสารสนเทศ", "ซอฟต์แวร์", "software", "เครือข่าย"]),
    ("เวชภัณฑ์/การแพทย์", ["เวชภัณฑ์", "วัสดุการแพทย์", "การแพทย์", "ทันตกรรม",
                          "รังสี", "ดมยา", "ผ่าตัด", "ต้อกระจก", "IVF", "ยาฉีด"]),
    ("ยานพาหนะ", ["รถบรรทุก", "รถโดยสาร", "ยานพาหนะ", "รถยนต์", "รถ"]),
    ("ครุภัณฑ์วิทยาศาสตร์", ["วิทยาศาสตร์", "ดาราศาสตร์", "กล้องโทรทรรศน์",
                            "กล้อง", "โฟโตนิกส์", "เวฟไกด์"]),
    ("งานก่อสร้าง/อาคาร", ["ก่อสร้าง", "อาคาร", "ปรับปรุง", "ซ่อมแซม", "ซ่อมบำรุง",
                          "ถนน", "สิ่งก่อสร้าง", "สถานที่"]),
    ("ครุภัณฑ์โฆษณา/เผยแพร่", ["โฆษณาและเผยแพร่", "โฆษณา"]),
    ("ครุภัณฑ์ไฟฟ้า", ["ไฟฟ้าและวิทยุ", "ไฟฟ้า"]),
    ("ครุภัณฑ์", ["ครุภัณฑ์"]),
    ("วัสดุ", ["วัสดุ"]),
    ("จ้างเหมาบริการ", ["จ้างเหมา", "บริการ", "บำรุงรักษา", "รักษาความปลอดภัย",
                       "ทำความสะอาด", "ดูแล"]),
    ("เช่า", ["เช่า"]),
]

TYPE_FALLBACK = {
    "ซื้อ": "พัสดุอื่นๆ",
    "เช่า": "เช่า",
    "จ้างก่อสร้าง": "งานก่อสร้าง/อาคาร",
    "จ้างเหมาบริการ": "จ้างเหมาบริการ",
}


def classify(name, ptype):
    """คืน (group, subGroup) จากชื่อโครงการ"""
    core = (name or "").strip()
    core = re.sub(r"^ประกวดราคา", "", core)
    core = re.sub(r"^(จ้างก่อสร้าง|จ้างเหมาบริการ|จ้างเหมา|จ้าง|เช่า|ซื้อ)", "", core)
    # ตัดท้ายที่ "จำนวน / ด้วยวิธี / โดยวิธี"
    core = re.split(r"\s*(?:จำนวน|ด้วยวิธี|โดยวิธี)", core)[0]
    core = re.sub(r"^\(\S+?\)\s*", "", core)       # ตัด (รหัส) นำหน้า
    core = re.sub(r"\([^)]*\)", "", core)          # ตัดวงเล็บอื่น
    obj = core.strip(" -–—")

    group, matched = None, None
    for label, kws in GROUPS:
        for kw in kws:
            if kw in name:
                group, matched = label, kw
                break
        if group:
            break
    if not group:
        group = TYPE_FALLBACK.get(ptype, "อื่นๆ")

    sub = obj
    if matched and obj.startswith(matched):
        sub = obj[len(matched):].strip(" -–—")
    sub = (sub or obj or "").strip()[:50]
    return group, (sub or "—")


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
        name = (r[4] or "").strip()
        ptype = (r[1] or "").strip()
        group, sub_group = classify(name, ptype)
        projects.append({
            "order": r[0],
            "type": ptype,
            "budgetRange": (r[2] or "").strip(),
            "code": str(r[3]).strip(),
            "name": name,
            "group": group,
            "subGroup": sub_group,
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

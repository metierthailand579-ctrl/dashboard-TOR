#!/usr/bin/env python3
"""TOR document health check
ไล่อ่านไฟล์ TOR ของแต่ละโครงการใน public/docs/<รหัส>/ ว่า "อ่านได้/อ่านออก" หรือไม่
แล้วเขียนผลเป็น data/healthcheck.json

เกณฑ์ต่อไฟล์:
  ok       = เปิด PDF ได้ และมีข้อความ (text) ให้สกัด
  no_text  = เปิดได้แต่ไม่มีข้อความ (น่าจะเป็นสแกนรูป/ภาพ)
  corrupt  = เปิดไม่ได้ / ไฟล์เสีย / ไม่ใช่ PDF
  missing  = ไม่พบไฟล์

สรุปต่อโครงการ:
  Read       = มีไฟล์ TOR อย่างน้อย 1 ไฟล์ที่ ok
  Can't Read = ไม่มีไฟล์ TOR ที่อ่านออกเลย (missing/corrupt/no_text ทั้งหมด)

รัน: python3 scripts/healthcheck.py
"""
import json
import os

try:
    from pypdf import PdfReader
    HAS_PYPDF = True
except ImportError:
    HAS_PYPDF = False

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "data")
DOCS = os.path.join(ROOT, "public", "docs")
MIN_TEXT_CHARS = 20  # มีตัวอักษรอย่างน้อยเท่านี้จึงนับว่า "อ่านออก"

REASON_TH = {
    "ok": "อ่านออก",
    "no_text": "ไม่มีข้อความ (อาจเป็นไฟล์สแกน/รูปภาพ)",
    "corrupt": "ไฟล์เสีย/เปิดไม่ได้",
    "missing": "ไม่พบไฟล์",
}


def check_file(path):
    if not os.path.isfile(path):
        return "missing"
    if not HAS_PYPDF:
        # ไม่มี pypdf: ตรวจแค่ว่ามีไฟล์และขึ้นต้นด้วย %PDF
        try:
            with open(path, "rb") as f:
                return "ok" if f.read(5) == b"%PDF-" else "corrupt"
        except OSError:
            return "corrupt"
    try:
        reader = PdfReader(path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
            if len(text) >= MIN_TEXT_CHARS:
                break
        return "ok" if len(text.strip()) >= MIN_TEXT_CHARS else "no_text"
    except Exception:
        return "corrupt"


def main():
    projects = json.load(open(os.path.join(DATA, "projects.json"), encoding="utf-8"))
    result = {}
    summary = {"Read": 0, "Can't Read": 0}

    for p in projects:
        code = p["code"]
        # ตรวจไฟล์ TOR ก่อน ถ้าไม่มี torFiles ระบุ ให้ตรวจไฟล์ทั้งหมด
        targets = p.get("torFiles") or p.get("files") or []
        file_results = []
        for fname in targets:
            status = check_file(os.path.join(DOCS, code, fname))
            file_results.append({
                "name": fname,
                "status": status,
                "reason": REASON_TH[status],
            })

        readable = any(fr["status"] == "ok" for fr in file_results)
        overall = "Read" if readable else "Can't Read"
        summary[overall] += 1

        # เหตุผลสรุป
        if readable:
            reason = "พบไฟล์ TOR ที่อ่านออก"
        elif not file_results:
            reason = "ไม่มีไฟล์ TOR ระบุไว้"
        else:
            # รวมเหตุผลที่เด่นที่สุด
            statuses = [fr["status"] for fr in file_results]
            top = max(set(statuses), key=statuses.count)
            reason = REASON_TH.get(top, "อ่านไม่ออก")

        result[code] = {
            "status": overall,
            "reason": reason,
            "files": file_results,
        }

    out = {
        "engine": "pypdf" if HAS_PYPDF else "magic-bytes",
        "summary": summary,
        "projects": result,
    }
    with open(os.path.join(DATA, "healthcheck.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    read_n = summary["Read"]
    cant_n = summary["Can't Read"]
    print(f"✓ healthcheck.json (engine={out['engine']})")
    print(f"  Read: {read_n}  |  Can't Read: {cant_n}")
    if not HAS_PYPDF:
        print("  ! ไม่มี pypdf — ตรวจแบบ magic-bytes เท่านั้น (pip install pypdf เพื่อตรวจ text)")


if __name__ == "__main__":
    main()

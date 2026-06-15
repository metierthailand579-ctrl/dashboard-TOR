#!/usr/bin/env python3
"""reclassify.py — จัดกลุ่มโครงการตาม SKILL `thai-municipal-project-grouping`

ลง keyword decision tree (2 ระบบขนาน × 2 ชั้น) ตามเอกสาร docs/grouping/SKILL.md
ใช้เป็น "เครื่องมือจัดกลุ่มที่ทำซ้ำได้" แทนการกรอกมือใน Excel — โดยเฉพาะกับ
แถวใหม่ที่เพิ่มเข้ามา หรือเวลาตรวจสอบความสม่ำเสมอ (consistency) ของการจัดกลุ่มเดิม

กฎ (จาก SKILL §1):
  1. Keyword decision tree เรียง priority (signal เฉพาะ/แรงไว้บน, กว้างไว้ล่าง)
  2. First-match-wins (เจอกฎแรกที่ตรง = ชนะ หยุดทันที → deterministic)
  3. ค้นใน (ชื่อโครงการ) ทั้งแบบดิบ(ไทย) และ lowercase(อังกฤษ)
  4. ใส่ variant สะกดเพี้ยนจาก OCR ลง keyword ด้วย
  5. Fallback เสมอ: work → "อื่นๆ" / metier → "NOT_APPLICABLE" (ห้ามเดามั่ว)
  6. Metier priority: SOFTWARE > CREATIVE > MEDIA > MARKETING ; ครุภัณฑ์ → "7. ครุภัณฑ์"

การใช้งาน:
  python3 scripts/reclassify.py            # audit: เทียบกับ data/projects.json + รายงานจุดต่าง
  python3 scripts/reclassify.py --write     # เขียนทับ (backup ก่อน) — ใช้เมื่อยืนยันแล้วเท่านั้น
  python3 scripts/reclassify.py --suggest "<ชื่อโครงการ>"   # ทดลองจัดกลุ่มชื่อเดียว

อ้างอิง: docs/grouping/SKILL.md (reference impl เดิม: s5c_reclassify.py)
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PROJECTS = os.path.join(ROOT, "data", "projects.json")

# ค่าคงที่ fallback
WORK_OTHER = "อื่นๆ"
METIER_NA = "NOT_APPLICABLE"

# ── ระบบ B: Metier service area (priority สูง→ต่ำ) ────────────────────────────
# (metierGroup, metierSubGroup, [keywords...]) — บนชนะล่าง, first-match-wins
# กลุ่มย่อย = canonical sub-service (จาก dropdown UI ของ Metier) เท่านั้น
# กลุ่มหลักคงเป็น "X Metier" · SOFTWARE > CREATIVE > MEDIA > MARKETING
SUB_OTHER = "อื่น ๆ (ยังไม่จัดประเภท)"
METIER_RULES = [
    # ── Software Metier (เฉพาะ→บน, ระบบกว้าง→ล่าง) ──
    ("Software Metier", "Mobile Application",
     ["แอปพลิเคชัน", "แอปพลิเคชั่น", "application", "mobile app", "mobile check", "ผ่านมือถือ"]),
    ("Software Metier", "Software Quality Assurance & Cyber Security",
     ["ไซเบอร์", "cyber", "ภัยคุกคามทางด้าน", "certification authority",
      "ใบรับรองอิเล็กทรอนิกส์", "ความปลอดภัยของระบบเทคโนโลยีสารสนเทศ", "quality assurance"]),
    ("Software Metier", "E-commerce Website",
     ["e-commerce", "พาณิชย์อิเล็กทรอนิกส์", "ร้านค้าออนไลน์"]),
    ("Software Metier", "ERP/CRM Systems",
     ["erp", "crm", "พัฒนาระบบ", "จัดทำระบบ", "จัดหาระบบ", "ระบบสารสนเทศ",
      "ระบบบริหารจัดการ", "ระบบการบริหารจัดการ", "e-portfolio", "portfolio", "registry",
      "voice bot", "ระบบลงทะเบียน", "ระบบติดตาม", "ระบบการจัดการ", "ระบบทะเบียน",
      "ระบบศูนย์บริการข้อมูล", "ระบบการประเมิน", "ระบบให้บริการ", "ระบบตรวจสอบ",
      "พัฒนาและออกแบบระบบ", "ปรับปรุงระบบ", "ระบบการดูแลผู้ป่วย", "platform", "แพลตฟอร์ม",
      "smart survey", "merchant management", "อัจฉริยะ"]),
    # UX/UI Design · Brand Website — นิยามไว้ใน taxonomy แต่ dataset นี้ยังไม่มีเข้าเกณฑ์
    # ── Creative Metier ──
    ("Creative Metier", "Event Marketing",
     ["จัดงาน", "จัดกิจกรรม", "นิทรรศการ", "ประเพณี", "ประเหณี", "สัมมนา",
      "มหกรรม", "เทศกาล", "festival", "event", "งานสัปดาห์", "ลอยกระทง",
      "การแข่งขัน", "รางวัล", "official contractor", "roll up", "วันสำคัญ",
      "ส่งเสริมการใช้ภาษาไทย", "in house training"]),
    ("Creative Metier", "Graphic Design",
     ["สื่อสิ่งพิมพ์", "สื่อสิืงพิมพ์", "สิ่งพิมพ์", "graphic", "ออกแบบสื่อ"]),
    ("Creative Metier", "Content Creation",
     ["ผลิตสื่อ", "ผลิตและเผยแพร่สื่อ", "คอนเทนต์", "content"]),
    # Branding and Identity · Video & 3D · Campaign Execution — นิยามไว้ ยังไม่มีเข้าเกณฑ์
    # ── Media Metier ──
    ("Media Metier", "Offline Media",
     ["หอกระจายข่าว", "เสียงไร้สาย", "เสียงตามสาย"]),
    ("Media Metier", "Public Relations",
     ["ประชาสัมพันธ์", "เผยแพร่ข่าวสาร", "เผยแพร่ข้อมูลข่าวสาร"]),
    # Ads Planning/Optimisation · AI Search Optimisation · SEO · KOLs · E-Commerce Ads
    # · Email Marketing — นิยามไว้ ยังไม่มีเข้าเกณฑ์
    # ── Marketing Metier ──
    ("Marketing Metier", "Brand Strategy",
     ["ภาพลักษณ์องค์กร", "brand strategy", "กลยุทธ์แบรนด์", "corporate image"]),
    # Business Development · Communication Strategy · Marketing Training · Sales Strategy
    # · Crisis Management · CRM Strategy — นิยามไว้ ยังไม่มีเข้าเกณฑ์
]

# canonical sub-service ทั้งหมดต่อกลุ่มหลัก (ชุดที่อนุญาต — ตรงกับ dropdown UI)
METIER_SUBSERVICES = {
    "Software Metier": ["UX / UI Design", "Brand Website", "Mobile Application",
                        "E-commerce Website", "ERP/CRM Systems",
                        "Software Quality Assurance & Cyber Security", SUB_OTHER],
    "Creative Metier": ["Branding and Identity", "Graphic Design", "Content Creation",
                        "Video & 3D", "Event Marketing", "Campaign Execution", SUB_OTHER],
    "Media Metier": ["Ads Planning", "Ads Optimisation", "AI Search Optimisation",
                     "SEO Services", "KOLs / Influencer", "Public Relations",
                     "E-Commerce Ads", "Email Marketing", "Offline Media", SUB_OTHER],
    "Marketing Metier": ["Business Development", "Brand Strategy", "Communication Strategy",
                         "Marketing Training", "Sales Strategy", "Crisis Management",
                         "CRM Strategy", SUB_OTHER],
}

# ── ระบบ A ชั้น 1: 7 หมวดงานเทศบาล (อนุมานจากเนื้อหา) ──────────────────────────
# ครุภัณฑ์มาก่อน (ข้ามทุกยุทธศาสตร์ — SKILL §2 ข้อ 2)
WORK_L1_RULES = [
    ("7. ครุภัณฑ์", ["ครุภัณฑ์"]),
    ("3. คุณภาพชีวิต",
     ["เวชภัณฑ์", "การแพทย์", "สาธารณสุข", "ผู้ป่วย", "วินิจฉัย", "รังสี",
      "ยาอัตโนมัติ", "ฟันปลอม", "สวัสดิการ", "ผ้าอ้อม", "นอนหลับ"]),
    ("6. ความสะอาดและสิ่งแวดล้อม",
     ["ขยะ", "มูลฝอย", "ของเสีย", "ทำความสะอาด", "สิ่งแวดล้อม", "บำบัด"]),
    ("5. การศึกษา ศาสนา กีฬา",
     ["กีฬา", "ฟุตบอล", "สนามกีฬา", "การเรียนการสอน", "การศึกษา", "ศาสนา",
      "นักเรียน", "นักศึกษา", "แข่งขัน"]),
    ("4. ชุมชนเข้มแข็ง",
     ["ชุมชนเข้มแข็ง", "ท่องเที่ยว", "พลังงานชุมชน", "วิสาหกิจชุมชน"]),
    ("2. โครงสร้างพื้นฐาน",
     ["ก่อสร้าง", "ถนน", "สะพาน", "ประปา", "ท่อ", "ระบายน้ำ", "ตลิ่ง", "เขื่อน",
      "อาคาร", "ไฟฟ้าส่องสว่าง", "แสงสว่าง", "โซล่าเซลล์", "โซลาร์", "ลาดยาง",
      "แอสฟัลท์", "คอนกรีต", "ปรับพื้นดิน"]),
    # 1. บริหารจัดการ = fallback (ดูล่าง)
]
WORK_L1_FALLBACK = "1. บริหารจัดการ"

# ── ระบบ A ชั้น 2: หมวดย่อย แยกตามหมวดใหญ่ (priority เฉพาะ→กว้าง) ───────────────
WORK_SUBCAT_RULES = {
    "1. บริหารจัดการ": [
        ("ป้องกันสาธารณภัย-ดับเพลิง", ["ดับเพลิง", "คับเพลิง", "ดับเหลิง", "สาธารณภัย", "เตือนภัย"]),
        ("รักษาความปลอดภัย", ["รักษาความปลอดภัย", "รปภ", "cctv", "กล้องวงจรปิด"]),
        ("ระบบสารสนเทศ/ดิจิทัล/ซอฟต์แวร์", ["ระบบสารสนเทศ", "ดิจิทัล", "ซอฟต์แวร์", "เทคโนโลยีสารสนเทศ", "ระบบเพิ่มประสิทธิภาพ"]),
        ("เครือข่าย/อินเทอร์เน็ต/IT บริการ", ["อินเทอร์เน็ต", "อินเทอร์เน็ท", "เครือข่าย", "network"]),
        ("ฝึกอบรม-พัฒนาบุคลากร", ["ฝึกอบรม", "พัฒนาทักษะ", "พัฒนาบุคลากร", "training", "สัมมนา"]),
        ("ตรวจสอบ-ที่ปรึกษา", ["ตรวจสอบกองทุน", "ที่ปรึกษา", "ผู้ให้บริการภายนอกตรวจสอบ"]),
        ("บริการสอบเทียบ/วิชาการ", ["สอบเทียบ", "เครื่องวัด"]),
        ("จัดหาเครื่องแต่งกาย/วัสดุทั่วไป", ["เครื่องแบบ", "เครื่องแต่งกาย", "ตัดเครื่อง"]),
        ("งานติดตั้ง/บริการอื่น", ["ติดตั้งอุปกรณ์"]),
        ("บำรุงรักษา/ซ่อม", ["บำรุงรักษา", "ซ่อม", "ช่อม", "maintenance"]),
        ("เช่า-จ้างเหมาบริการ (ทั่วไป)", ["เช่า", "จ้างเหมา", "เหมาบริการ"]),
    ],
    "2. โครงสร้างพื้นฐาน": [
        ("ไฟฟ้า-พลังงานแสงอาทิตย์", ["แสงอาทิตย์", "solar", "โซล่าเซลล์", "โซลาร์", "rooftop"]),
        ("ระบบระบายน้ำ/ป้องกันตลิ่ง", ["ระบายน้ำ", "ตลิ่ง", "เขื่อน"]),
        ("ประปา-แหล่งน้ำ", ["ประปา", "วางท่อ", "แหล่งน้ำ", "บ่อน้ำ"]),
        ("ไฟฟ้า-แสงสว่าง/สาธารณูปโภค", ["ไฟฟ้าส่องสว่าง", "แสงสว่าง", "ดวงโคม", "เสาไฟ"]),
        ("ถนน-คอนกรีต (คสล.)", ["คอนกรีตเสริมเหล็ก", "ค.ส.ล", "คสล", "ถนนคอนกรีต", "ก่อสร้างถบบ"]),
        ("ถนน-แอสฟัลท์/ลาดยาง", ["แอสฟัลท์", "ลาดยาง", "โอเวอร์เลย์", "ผิวจราจร"]),
        ("ถนน-บำรุง/ทั่วไป", ["บำรุงถนน", "ปรับปรุงถนน", "ถนนสาย"]),
        ("งานระบบประกอบอาคาร (ปรับ/ระบายอากาศ)", ["ระบายอากาศ", "ทำความเย็น", "ปรับอากาศ", "chiller"]),
        ("สะพาน/ทางเชื่อม", ["สะพาน", "ทางเดินเชื่อม", "ทางเชื่อม"]),
        ("วัสดุก่อสร้าง", ["วัสดุ"]),
        ("อาคาร/สิ่งก่อสร้าง/ลาน", ["อาคาร", "ก่อสร้าง", "ลาน", "container", "ปรับพื้นดิน"]),
    ],
    "3. คุณภาพชีวิต": [
        ("สวัสดิการ-ช่วยเหลือสังคม", ["สวัสดิการ", "ผ้าอ้อม", "ช่วยเหลือ", "ภาวะพึ่งพิง"]),
        ("เวชภัณฑ์ยา/วัสดุการแพทย์", ["เวชภัณฑ์", "ยา", "วัสดุการแพทย์", "รังสีวินิจฉัย"]),
        ("บริการตรวจวินิจฉัย/แล็บ", ["ตรวจวิเคราะห์", "วินิจฉัย", "แล็บ", "ห้องปฏิบัติการ", "นอนหลับ"]),
        ("บริการสาธารณสุข", ["สาธารณสุข", "ผู้ป่วย", "จัดยาอัตโนมัติ", "การแพทย์"]),
    ],
    "4. ชุมชนเข้มแข็ง": [
        ("ชุมชน-ท่องเที่ยว-พลังงานชุมชน", ["ชุมชน", "ท่องเที่ยว", "พลังงานชุมชน"]),
    ],
    "5. การศึกษา ศาสนา กีฬา": [
        ("กีฬา-การแข่งขัน", ["การแข่งขัน", "แข่งขัน", "ชิงชนะเลิศ"]),
        ("สนามกีฬา", ["สนามกีฬา", "สนามฟุตบอล", "ลู่วิ่ง"]),
        ("สื่อ/อุปกรณ์การเรียนการสอน", ["การเรียนการสอน", "อุปกรณ์การเรียน", "สื่อการสอน", "เครือข่ายอินเทอร์เน็ต"]),
    ],
    "6. ความสะอาดและสิ่งแวดล้อม": [
        ("กำจัดขยะ/ของเสีย", ["ขยะ", "มูลฝอย", "ของเสีย", "กำจัด"]),
        ("ทำความสะอาด", ["ทำความสะอาด", "เคมีภัณฑ์", "ซักผ้า"]),
    ],
    "7. ครุภัณฑ์": [
        ("ครุภัณฑ์/วัสดุ-โซลาร์", ["โซล่าเซลล์", "โซลาร์", "solar"]),
        ("ครุภัณฑ์-ยานพาหนะ", ["รถบรรทุก", "รถยนต์", "ยานพาหนะ", "รถ"]),
        ("ครุภัณฑ์-คอมพิวเตอร์/IT", ["คอมพิวเตอร์", "workstation", "server", "notebook"]),
        ("ครุภัณฑ์-โฆษณา/Display/CCTV", ["โฆษณาและเผยแพร่", "display", "cctv", "จอ"]),
        ("ครุภัณฑ์-สำนักงาน", ["เครื่องปรับอากาศ", "สำนักงาน", "โต๊ะ", "เก้าอี้"]),
        ("ครุภัณฑ์-ก่อสร้าง/เครื่องจักร", ["เครื่องจักร", "ถังสำรองแรงดัน", "ก่อสร้าง"]),
        ("ครุภัณฑ์-ไฟฟ้าและวิทยุ", ["ไฟฟ้าและวิทยุ", "วิทยุ"]),
        ("ครุภัณฑ์/วัสดุ-ดาราศาสตร์-วิจัย", ["ดาราศาสตร์", "วิจัย", "รับสัญญาณ", "ตัวนำยิ่งยวด"]),
        ("ครุภัณฑ์-วิทยาศาสตร์/การแพทย์", ["วิทยาศาสตร์", "การแพทย์"]),
    ],
}


def haystack(name):
    """ข้อความค้นหา — คืน (raw ไทย, lowercase) ตาม SKILL §1 กฎ 4"""
    raw = name or ""
    return raw, raw.lower()


def match_any(keywords, raw, low):
    """ตรง keyword ไหนสักตัว (ทั้งแบบดิบและ lowercase) — SKILL §1 กฎ 4"""
    for kw in keywords:
        if kw in raw or kw.lower() in low:
            return True
    return False


def classify_metier(name):
    """ระบบ B → (metierGroup, metierSubGroup) ; first-match-wins ; fallback NA"""
    raw, low = haystack(name)
    for g, s, kws in METIER_RULES:
        if match_any(kws, raw, low):
            return g, s
    return METIER_NA, METIER_NA


def classify_work_l1(name):
    """ระบบ A ชั้น 1 → 1 ใน 7 หมวด ; ครุภัณฑ์มาก่อน ; fallback บริหารจัดการ"""
    raw, low = haystack(name)
    for label, kws in WORK_L1_RULES:
        if match_any(kws, raw, low):
            return label
    return WORK_L1_FALLBACK


def classify_work_l2(name, work_l1):
    """ระบบ A ชั้น 2 → หมวดย่อยใต้ work_l1 ; fallback อื่นๆ"""
    raw, low = haystack(name)
    for label, kws in WORK_SUBCAT_RULES.get(work_l1, []):
        if match_any(kws, raw, low):
            return label
    return WORK_OTHER


def classify(name):
    """คืน 4 ฟิลด์ตาม SKILL: (work_l1, work_l2, metier_l1, metier_l2)"""
    work_l1 = classify_work_l1(name)
    work_l2 = classify_work_l2(name, work_l1)
    metier_l1, metier_l2 = classify_metier(name)
    return work_l1, work_l2, metier_l1, metier_l2


def audit():
    """รันกับ data/projects.json — เทียบผลกับที่จัดมือไว้ + รายงาน agreement"""
    projects = json.load(open(PROJECTS, encoding="utf-8"))
    fields = ["workGroup", "workSubGroup", "metierGroup", "metierSubGroup"]
    agree = {f: 0 for f in fields}
    mismatches = {f: [] for f in fields}
    for p in projects:
        w1, w2, m1, m2 = classify(p["name"])
        pred = {"workGroup": w1, "workSubGroup": w2, "metierGroup": m1, "metierSubGroup": m2}
        for f in fields:
            if pred[f] == p[f]:
                agree[f] += 1
            else:
                mismatches[f].append((p["order"], p["name"][:48], p[f], pred[f]))

    n = len(projects)
    print(f"== Audit: keyword tree เทียบกับการจัดกลุ่มเดิม ({n} โครงการ) ==\n")
    for f in fields:
        pct = round(agree[f] / n * 100, 1) if n else 0
        print(f"  {f:<16} ตรง {agree[f]:>3}/{n}  ({pct}%)")

    # โชว์ตัวอย่าง mismatch ของ metierGroup (ระบบที่สำคัญต่อธุรกิจ)
    print(f"\n== ตัวอย่างจุดต่าง metierGroup (รวม {len(mismatches['metierGroup'])}) ==")
    print("   [ลำดับ] ชื่อ — เดิม → เครื่องเสนอ")
    for order, nm, old, new in mismatches["metierGroup"][:15]:
        print(f"   [{order}] {nm} — {old} → {new}")
    print("\nหมายเหตุ: keyword tree เป็นเกณฑ์ทำซ้ำได้/ใช้กับแถวใหม่ — จุดต่างคือจุดที่ควร")
    print("ให้คนตรวจ (การจัดมือเดิมอาจใช้ดุลพินิจที่ keyword จับไม่ได้). ไม่เขียนทับอัตโนมัติ")
    return mismatches


def write_back():
    """เขียนผลการจัดกลุ่มทับ projects.json (backup ก่อน) — ใช้เมื่อยืนยันแล้ว"""
    import shutil
    backup = PROJECTS + ".pre_reclassify.bak"
    shutil.copy(PROJECTS, backup)
    projects = json.load(open(PROJECTS, encoding="utf-8"))
    changed = 0
    for p in projects:
        w1, w2, m1, m2 = classify(p["name"])
        new = {"group": w1, "subGroup": w2, "workGroup": w1, "workSubGroup": w2,
               "metierGroup": m1, "metierSubGroup": m2}
        for k, v in new.items():
            if p.get(k) != v:
                p["_prev_" + k] = p.get(k)  # เก็บค่าเก่าเพื่อ audit (SKILL §4)
                p[k] = v
                changed += 1
    json.dump(projects, open(PROJECTS, "w", encoding="utf-8"),
              ensure_ascii=False, indent=2)
    print(f"✓ เขียนทับแล้ว (backup: {os.path.basename(backup)}) — แก้ {changed} ฟิลด์")


def suggest(name):
    w1, w2, m1, m2 = classify(name)
    print(f"ชื่อ: {name}")
    print(f"  กลุ่มหลัก  : {w1}")
    print(f"  กลุ่มย่อย  : {w2}")
    print(f"  Metier     : {m1}" + (f" / {m2}" if m1 != METIER_NA else ""))


if __name__ == "__main__":
    args = sys.argv[1:]
    if args and args[0] == "--write":
        write_back()
    elif args and args[0] == "--suggest":
        suggest(" ".join(args[1:]))
    else:
        audit()

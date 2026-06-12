# การจัดกลุ่มโครงการ (Grouping) — SKILL `thai-municipal-project-grouping`

โฟลเดอร์นี้คือ **เกณฑ์มาตรฐานการจัดกลุ่มหลัก/กลุ่มย่อย** ของโครงการ TOR ในเว็บนี้
(ย้ายมาจาก `.next/selectgroup/` ซึ่งเป็น build output ที่ไม่เสถียร)

| ไฟล์ | คือ |
|------|-----|
| `SKILL.md` | วิธีจัดกลุ่มฉบับเต็ม — keyword decision tree, 2 ระบบ × 2 ชั้น (อ่านอันนี้ก่อน) |
| `SOP.md` | วิธีคิดรวมของโปรเจกต์ต้นทาง (grounding, reproducible, reversible) |
| `PROCESS.md` | ลำดับงาน S1→S11 ของโปรเจกต์ต้นทาง |
| `SOURCE_CLAUDE.md` | memory ต้นทาง (โปรเจกต์ Khlong Luang × Metier) — บริบทที่มาของ SKILL |

> **กฎ:** ทุกครั้งที่กำหนด/แก้การจัดกลุ่ม ให้ยึด `SKILL.md` เป็นเกณฑ์ — ห้ามจัดตามใจ

## map กับ data model ของเว็บนี้

SKILL ใช้ 4 ฟิลด์ → ตรงกับฟิลด์ใน `data/projects.json`:

| SKILL | ฟิลด์ในเว็บนี้ | ค่า |
|-------|---------------|-----|
| `work_category_layer1` | `workGroup` (= `group`) | 7 หมวด: `1. บริหารจัดการ` … `7. ครุภัณฑ์` |
| `work_category_layer2` | `workSubGroup` (= `subGroup`) | ~40 หมวดย่อย |
| `metier_service_area_layer1` | `metierGroup` | `Software/Creative/Media/Marketing Metier` หรือ `NOT_APPLICABLE` |
| `metier_service_area_layer2` | `metierSubGroup` | sub-area (System Development, Public Relations, …) |

หมายเหตุ ชื่อ Metier ในเว็บนี้ใช้ `* Metier` (เช่น `Software Metier`) ส่วน SKILL ต้นทางใช้
`SOFTWARE DEVELOPMENT` ฯลฯ — เป็น area เดียวกัน mapping ตรงตัว

## เครื่องมือ: `scripts/reclassify.py`

ลง keyword decision tree ของ SKILL จริง (reproducible — ดู `s5c_reclassify.py` ต้นทาง)

```bash
python3 scripts/reclassify.py                    # audit: เทียบผลกับ projects.json + รายงานจุดต่าง
python3 scripts/reclassify.py --suggest "<ชื่อโครงการ>"   # ทดลองจัดกลุ่มชื่อเดียว (ใช้กับแถวใหม่)
python3 scripts/reclassify.py --write             # เขียนทับ (backup ก่อน) — ใช้เมื่อยืนยันแล้วเท่านั้น
```

### ผล audit ล่าสุด (310 โครงการ)

| ฟิลด์ | ตรงกับการจัดมือ | อ่านผล |
|------|-----------------|--------|
| `metierGroup` | **96.1%** | เกณฑ์ keyword จัด Metier ได้แม่นมาก — ใช้ได้จริงกับแถวใหม่ |
| `metierSubGroup` | **95.8%** | เช่นกัน |
| `workGroup` | 47.4% | หมวดเทศบาลอิงบริบท/ยุทธศาสตร์ ไม่ใช่แค่คำในชื่อ → เป็น "ตัวเสนอ" |
| `workSubGroup` | 40.0% | ต้องให้คนตรวจประกอบ |

**สรุปการใช้งาน:**
- **ระบบ Metier** (ระบบ B) → เชื่อสคริปต์ได้ ใช้จัด/ตรวจอัตโนมัติได้เลย
- **ระบบหมวดงานเทศบาล** (ระบบ A) → ใช้สคริปต์เป็นตัวเสนอเบื้องต้น แล้วคนยืนยัน
- สคริปต์ **default = audit (ไม่ทับข้อมูล)** ตามหลัก "reversible over destructive" ของ SKILL

> เมื่อมี Excel รอบใหม่ที่เพิ่มโครงการ: รัน `--suggest` ดูข้อเสนอกลุ่มของแถวใหม่ → กรอกใน Excel →
> `npm run build:data` ตามปกติ (build:data ยังอ่านกลุ่มจาก Excel เป็นหลัก)

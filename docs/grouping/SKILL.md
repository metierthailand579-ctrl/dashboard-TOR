---
name: thai-municipal-project-grouping
description: >
  วิธีคิดการจัดกลุ่ม (Layer 1) และจัดกลุ่มย่อย (Layer 2 / Sub-group) ของโครงการ
  ในแผนพัฒนาท้องถิ่นไทย + การ map โอกาสทางธุรกิจ (Metier service area) แบบขนานกัน
  ออกแบบให้ AI ตัวอื่นอ่านแล้วทำต่อได้ทันที ด้วย "วิธีคิดเดียวกัน"
when_to_use: >
  เมื่อต้องจัดประเภทโครงการราชการ/เทศบาลจำนวนมากเป็นหมวด→หมวดย่อย และ/หรือ
  ต้องประเมินว่าโครงการไหนตรงกับขีดความสามารถของบริษัทใดบริษัทหนึ่ง
inputs: ชุด record ที่มีอย่างน้อย project_name_th + objective_or_rationale
outputs: 4 ฟิลด์ — work_category_layer1, work_category_layer2, metier_service_area_layer1, metier_service_area_layer2
---

# SKILL — วิธีจัดกลุ่ม & Sub-group (ส่งต่อให้ AI อื่นทำต่อได้)

> **เป้าหมายของไฟล์นี้:** ใครก็ตาม (คนหรือ AI) อ่านจบแล้วจัดกลุ่ม record ใหม่ได้ **ด้วยตรรกะเดียวกับที่ทำมาแล้ว 1,333 records** — ไม่ใช่ "จัดตามใจ" แต่ตามกฎที่กำหนดไว้ชัด ตรวจสอบย้อนได้ และทำซ้ำได้
> Reference implementation จริง: `output/extraction/s5c_reclassify.py`

---

## 0. โมเดลความคิด (Mental Model) — อ่านก่อนทุกอย่าง

ทุก record ถูกติดป้าย **2 ระบบขนานกัน · แต่ละระบบมี 2 ชั้น** = 4 ฟิลด์:

```
┌─ ระบบ A: "นี่คืองานประเภทอะไรของเทศบาล?" ───────────────┐
│  work_category_layer1   = หมวดใหญ่ (ยุทธศาสตร์/ครุภัณฑ์) │
│  work_category_layer2   = หมวดย่อย (ประเภทงานเฉพาะ)      │
└──────────────────────────────────────────────────────────┘
┌─ ระบบ B: "บริษัทเรา (Metier) ทำงานนี้ได้ไหม?" ──────────┐
│  metier_service_area_layer1 = 4 service area / NOT_APPLICABLE │
│  metier_service_area_layer2 = sub-area เฉพาะ                  │
└──────────────────────────────────────────────────────────┘
```

**กุญแจสำคัญ 3 ข้อ:**
1. **2 ระบบนี้อิสระต่อกัน** — งานหนึ่งอาจเป็น "ครุภัณฑ์-คอมพิวเตอร์" (ระบบ A) และเป็น "SOFTWARE DEVELOPMENT" (ระบบ B) พร้อมกัน · หรือเป็น "ถนน-คอนกรีต" (A) แต่ `NOT_APPLICABLE` (B)
2. **Layer 1 = ตะกร้าใหญ่, Layer 2 = ช่องในตะกร้า** — Layer 2 ต้องอยู่ใต้ Layer 1 อย่างมีเหตุผลเสมอ
3. **มี "ถังพัก" เสมอ** — `อื่นๆ` (ระบบ A) และ `NOT_APPLICABLE` (ระบบ B) แปลว่า "ยังไม่เข้าเกณฑ์ไหน" **ไม่ใช่** "พิจารณาแล้วว่าไม่มีหมวด" → ต้องวนกลับมาแตกถังนี้ภายหลัง (ดู §5)

---

## 1. กฎกลางของการจัดกลุ่ม (ใช้กับทั้ง 2 ระบบ)

### กฎ 1 — Keyword Decision Tree เรียงตาม Priority
- เขียนกฎเป็น **list มีลำดับ** `[(label, [keywords...]), ...]`
- **signal ที่แรงและเฉพาะเจาะจง → วางบนสุด** · signal กว้าง/คลุมเครือ → วางล่างสุด
- เหตุผล: ถ้าวางกฎกว้างไว้บน มันจะ "ดูด" record ที่ควรเข้าหมวดเฉพาะ

### กฎ 2 — First-Match-Wins
- ไล่กฎจากบนลงล่าง · **กฎแรกที่ keyword ตรง = ชนะ หยุดทันที** ไม่ไล่ต่อ
- ทำให้ผลลัพธ์ deterministic (record เดิม → หมวดเดิมเสมอ)

### กฎ 3 — มี Fallback เสมอ
- ไล่จนหมดไม่ตรงอะไร → `อื่นๆ` (ระบบ A) / `NOT_APPLICABLE` (ระบบ B)
- **ห้ามเดาหมวดมั่ว ๆ** — เข้าถังพักดีกว่าใส่ผิดหมวด

### กฎ 4 — Haystack = ชื่อ + วัตถุประสงค์
- ค้น keyword ใน `project_name_th` **รวมกับ** `objective_or_rationale` เป็นข้อความเดียว
- match **ทั้งข้อความดิบ (ไทย case-preserved)** และ **lowercase** (เผื่อคำอังกฤษปน เช่น "Mobile App")

### กฎ 5 — รองรับ OCR เพี้ยน (สำคัญมากกับเอกสารไทยสแกน)
- เอกสารราชการสแกน → OCR สะกดเพี้ยนประจำ · **ต้องใส่ variant เพี้ยนลง keyword list ด้วย**
- ตัวอย่างจริงจาก `s5c_reclassify.py`:

| คำถูก | variant เพี้ยนที่ต้องใส่ด้วย |
|---|---|
| ถมดิน | `ถมติน` |
| พัฒนา | `หัฒนา` |
| ดับเพลิง | `คับเพลิง`, `ดับเหลิง` |
| ศูนย์พัฒนา | `ศูนย์หัฒนา` |
| ซ่อมแซมศูนย์ | `ช่อมแซมศูนย์`, `ซ่อมแชมศูนย์` |
| ขยายเขตไฟฟ้า | `ขยายเขตไหฟ้า` |
| ประเพณี | `ประเหณี` |
| ต่อเติมศูนย์ | `ต่อเต็มศูนย์` |
| ก่อสร้างถนน ค.สล. | `ก่อสร้างถบบ ค.ส8` |

> **หลักคิด:** อย่าทำความสะอาด OCR ก่อนแล้วค่อย match (เสี่ยงทำข้อมูลเพี้ยนเพิ่ม) — ให้ **ขยาย keyword ให้ครอบ variant** แทน · ปลอดภัยกว่าและตรวจสอบย้อนได้

---

## 2. ระบบ A — work_category (งานเทศบาล)

### Layer 1 — 7 หมวดใหญ่ (จากยุทธศาสตร์แผน + ครุภัณฑ์)
ค่าจริงที่ใช้ (ห้ามเปลี่ยน label เพื่อให้ join/filter ทำงาน):
```
1. บริหารจัดการ
2. โครงสร้างพื้นฐาน
3. คุณภาพชีวิต
4. ชุมชนเข้มแข็ง
5. การศึกษา ศาสนา กีฬา
6. ความสะอาดและสิ่งแวดล้อม
7. ครุภัณฑ์            ← พิเศษ: แยกออกมาเพราะครุภัณฑ์ (equipment) ข้ามทุกยุทธศาสตร์
```

**วิธีเลือก Layer 1:**
1. ถ้า record มี `strategy_or_plan_category` (ยุทธศาสตร์) จากเอกสาร → ใช้ map ตรง ๆ (source-grounded ดีที่สุด)
2. ถ้าเป็น **ครุภัณฑ์/equipment line item** → เข้า `7. ครุภัณฑ์` เสมอ (ไม่ว่าอยู่ยุทธศาสตร์ไหน)
3. ถ้าไม่มี → อนุมานจากเนื้อหา (ถนน/สะพาน/ท่อ → โครงสร้างพื้นฐาน ฯลฯ)

### Layer 2 — ~50 หมวดย่อย (ตัวอย่างจริง + จำนวน record)
```
ถนน-คอนกรีต 242 · ครุภัณฑ์-วิทยาศาสตร์/การแพทย์ 224 · ครุภัณฑ์-สำนักงาน 89
ครุภัณฑ์-ยานพาหนะ 74 · ระบบระบายน้ำ 73 · ฝึกอบรม-พัฒนาบุคลากร 44
เช่า-จ้างเหมาบริการ 40 · ก่อสร้าง/ปรับปรุงอาคาร 37 · ครุภัณฑ์-ไฟฟ้าและวิทยุ 33
สะพาน 32 · ครุภัณฑ์-โฆษณา/Display 32 · ก่อสร้าง/ปรับปรุงศูนย์พัฒนาเด็กเล็ก 30
ถนน-แอสฟัลท์ 27 · ครุภัณฑ์-ก่อสร้าง 26 · ครุภัณฑ์-การเกษตร 25
ครุภัณฑ์-คอมพิวเตอร์/IT 20 · ความปลอดภัย-CCTV 19 · อาหารกลางวัน-นม 18
ธรรมาภิบาล-ต่อต้านทุจริต 13 · Smart City/ดิจิทัล 9 · ระบบประปา 9 · ...
```

**หลักการตั้งชื่อ Layer 2:**
- ใช้รูปแบบ `กลุ่มงาน-ชนิดเฉพาะ` (เช่น `ครุภัณฑ์-คอมพิวเตอร์/IT`, `ถนน-คอนกรีต`)
- ครุภัณฑ์แตกย่อยตามประเภทพัสดุ (สำนักงาน/ยานพาหนะ/การแพทย์/คอมพิวเตอร์/...)
- งานก่อสร้างแตกตามวัสดุ/วัตถุ (ถนน-คอนกรีต vs ถนน-แอสฟัลท์ vs ถนน-ลูกรัง)

---

## 3. ระบบ B — Metier service area (โอกาสธุรกิจ)

### Layer 1 — 4 service area + NOT_APPLICABLE
**Decision tree เรียง priority (จาก `metier_classifier_rules` — บนชนะล่าง):**

```
1) SOFTWARE DEVELOPMENT  ← keywords: smart city, อัจฉริยะ, ดิจิทัล, แพลตฟอร์ม,
      แอปพลิเคชัน, mobile app, เว็บไซต์, website, erp, crm, server, แม่ข่าย,
      ระบบปฏิบัติการ, cyber, security
2) CREATIVE PRODUCTION   ← led outdoor full color, ป้ายประชาสัมพันธ์อิเล็กทรอนิกส์,
      อีเว้นท์, event, ประเพณี, วันสำคัญ, เทศกาล, video, ออกแบบ, คอนเทนต์,
      content, ผลิตสื่อ, จัดทำสื่อ
3) MEDIA MANAGEMENT      ← ประชาสัมพันธ์, social media, facebook, kol, influencer,
      ads, โฆษณาออนไลน์, seo, email marketing, วารสาร, เผยแพร่ข่าวสาร,
      เผยแพร่ข้อมูลข่าวสาร, เสียงไร้สาย, เสียงตามสาย
4) MARKETING             ← brand strategy, กลยุทธ์แบรนด์, communication strategy,
      แผนการสื่อสาร, crisis management, marketing training, business development,
      sales strategy
5) NOT_APPLICABLE        ← fallback (ถนน/ท่อ/ครุภัณฑ์การแพทย์/สวัสดิการ ฯลฯ)
```

> **ทำไม SOFTWARE อยู่บนสุด:** ถ้า "แอปพลิเคชันประชาสัมพันธ์" ปล่อยให้ MEDIA จับก่อน จะพลาดมูลค่างานพัฒนาซอฟต์แวร์ที่สูงกว่า · จัดลำดับให้ **service area ที่มูลค่า/ความเฉพาะสูงกว่า อยู่บน**

> **ข้อสังเกตจริง:** MARKETING = 0 records เพราะเอกสารราชการไม่เขียน "Brand/Communication/Sales Strategy" ตรง ๆ — **อย่าฝืน promote** ให้ปล่อยเป็น 0 (เป็น finding ที่ซื่อตรง ไม่ใช่ความผิดพลาด)

### Layer 2 — sub-area (ค่าจริงที่ใช้)
```
SOFTWARE DEVELOPMENT → Smart City/Platform Development · Mobile Application ·
                        Brand Website / E-commerce Website · Server/IT Infrastructure ·
                        IT Hardware Procurement (less aligned)
CREATIVE PRODUCTION  → Event Marketing/Festival · Branding & Display Production ·
                        Graphic Design · Content Creation · Production Equipment (less aligned)
MEDIA MANAGEMENT     → Public Relations · Offline Media · Public Relations/Digital Media
```

> **ป้าย "(less aligned)"** = ตรง keyword แต่เป็นแค่ "จัดซื้อฮาร์ดแวร์/อุปกรณ์" ไม่ใช่งานบริการที่ Metier ทำจริง → ติดป้ายเตือนไว้ ไม่ทิ้ง แต่ก็ไม่นับเป็นโอกาสเต็ม

---

## 4. ขั้นตอนปฏิบัติ (Algorithm — pseudocode)

```python
def classify_record(record):
    name = record["project_name_th"] or ""
    obj  = record["objective_or_rationale"] or ""
    raw  = f"{name} {obj}"          # ข้อความดิบ (ไทย)
    hay  = raw.lower()             # สำหรับคำอังกฤษ

    # ระบบ B ก่อน (เพราะ NOT_APPLICABLE เป็น input ของ §5)
    metier_l1, metier_l2 = "NOT_APPLICABLE", "NOT_APPLICABLE"
    for l1, l2, kws in METIER_RULES:        # เรียง priority SOFTWARE→...→MARKETING
        if any(kw in raw or kw.lower() in hay for kw in kws):
            metier_l1, metier_l2 = l1, l2
            break                            # first-match-wins

    # ระบบ A
    work_l1 = pick_layer1(record)            # จาก strategy_or_plan_category / equipment / อนุมาน
    work_l2 = "อื่นๆ"
    for label, kws in SUBCAT_RULES:          # เรียง priority เฉพาะ→กว้าง
        if any(kw in raw or kw.lower() in hay for kw in kws):
            work_l2 = label
            break

    return work_l1, work_l2, metier_l1, metier_l2
```

**ลำดับการรันใน batch (จาก s5c จริง):**
1. **Pass 1:** วน record ที่ `metier_l1 == NOT_APPLICABLE` → re-check ด้วย METIER_RULES → ถ้าเจอ ให้ promote (เก็บค่าเก่าใน `_prev_metier_l1/l2` เพื่อ audit)
2. **Pass 2:** วน record ที่ยัง `NOT_APPLICABLE` **และ** `work_l2 == "อื่นๆ"` → แตกเป็น sub-category (เก็บ `_prev_work_l2`)
3. **Save + report:** เขียนทับไฟล์ + print diff (กี่ตัว promote, กี่ตัวออกจาก อื่นๆ, distribution สุดท้าย)

---

## 5. การแตก "ถังพัก" (Residual Re-classification) — หัวใจของ S5c

**ปัญหา:** หลังรอบแรก เหลือ 114 record ที่เป็น `NOT_APPLICABLE` + `อื่นๆ` พร้อมกัน — กองรวมไม่มีความหมาย

**วิธีคิด:**
1. **อ่านถังพักจริง ๆ** — ดูชื่อโครงการ 114 ตัว มองหา theme ที่ซ้ำ
2. **ตั้ง sub-category ใหม่จาก theme ที่เจอ** (s5c ตั้งเพิ่ม 26 หมวด) เช่น:
   `ธรรมาภิบาล-ต่อต้านทุจริต` · `เวทีประชาคม-เทศบาลเคลื่อนที่` · `แผนพัฒนา-เทศบัญญัติ-งบประมาณ` ·
   `ก่อสร้าง/ปรับปรุงศูนย์พัฒนาเด็กเล็ก` · `ขยายเขตไฟฟ้า` · `ป้องกันสาธารณภัย-ดับเพลิง` ·
   `สวัสดิการ-ช่วยเหลือสังคม` · `สาธารณสุขเคลื่อนที่-สัตวแพทย์` · `เสียงตามสาย-สื่อสารชุมชน` ฯลฯ
3. **เรียง sub-category rules ตาม priority** — เฉพาะเจาะจงบน, generic ล่าง:
   - บนสุด: `ธรรมาภิบาล-ต่อต้านทุจริต`, `เวทีประชาคม` (signal ชัด)
   - ล่างสุด: `ฝึกอบรม-พัฒนาบุคลากร`, `ส่งเสริมความรู้ทั่วไป` (generic — ใส่ไว้ท้ายไม่ให้ดูดของหมวดอื่น)
4. **ยอมรับเศษที่เหลือ** — s5c เหลือ `อื่นๆ` 11 ตัว (ชื่อ truncated จาก OCR จริง ๆ) → **ไม่ฝืนยัดหมวด** ปล่อยไว้ + flag

**ผลลัพธ์ S5c:** 105/114 ย้ายออกจาก อื่นๆ + 6 promote เป็น Metier (วารสาร→PR, แอปพลิเคชัน→Mobile App, เสียงไร้สาย→Offline Media)

> **บทเรียน:** การจัดกลุ่มที่ดีคือ **วนซ้ำ** — รอบแรกได้โครงหยาบ, รอบสองแตกถังพักให้ละเอียดขึ้น · ไม่ใช่ one-shot

---

## 6. การจัดกลุ่มแบบ Configurable (ใน web `/groups`)

นอกจากกลุ่มที่ baked ไว้ในข้อมูล ผู้ใช้ยังจัดกลุ่ม **on-the-fly** ได้ — เลือกเอง 3 อย่าง:

**Primary dimension × Secondary dimension × Metric** (drill-down ได้)

9 dimensions ที่เลือกได้:
`work_category_layer1` · `work_category_layer2` · `metier_service_area_layer1` · `metier_service_area_layer2` · `responsible_department` · `source_pdf_file` · `first_planned_year` · `project_status_type` · `document_type`

4 metrics: `งบประมาณรวม` · `จำนวนโครงการ` · `งบเฉลี่ย/โครงการ` · `งบสูงสุด/โครงการ`

**วิธีคิดของ engine (จาก `groups-explorer.tsx`):**
```
bucket = Map<primaryValue, { values:[], children: Map<secondaryValue, {...}> }>
สำหรับแต่ละ record: หยอดงบเข้า outer[primary] และ inner[secondary]
แล้ว computeMetric() ตาม metric ที่เลือก → sort มาก→น้อย → treemap + ตาราง drill-down
```
ค่าที่ขาด → bucket ชื่อ `(ไม่ระบุ)` · secondary = NONE → จัด Layer 1 อย่างเดียว

> **หลักคิด:** ให้ **เครื่องมือจัดกลุ่ม** ไม่ใช่ **มุมมองสำเร็จรูป** — user ตั้งคำถามกับข้อมูลได้เองทุกแบบ

---

## 7. RECIPE — ก๊อปไปสั่ง AI ตัวอื่นให้ทำต่อด้วยวิธีคิดเดียวกัน

> วางข้อความนี้ให้ AI อีกตัว (พร้อมแนบ `SKILL.md` + ตัวอย่างข้อมูล) แล้วมันจะจัดกลุ่มได้สอดคล้องกับของเดิม

```
คุณกำลังจัดกลุ่มโครงการเทศบาลไทยตามสกิล thai-municipal-project-grouping
ทำตามกฎนี้เคร่งครัด:

1. ทุก record ติด 4 ฟิลด์: work_category_layer1, work_category_layer2,
   metier_service_area_layer1, metier_service_area_layer2
2. ใช้ keyword decision tree เรียง priority (signal เฉพาะ/แรง ไว้บน) + first-match-wins
3. ค้น keyword ใน (project_name_th + objective_or_rationale) ทั้งแบบดิบและ lowercase
4. ใส่ variant สะกดเพี้ยนจาก OCR ลง keyword ด้วย (เช่น พัฒนา/หัฒนา, ถมดิน/ถมติน)
5. ไม่ตรงกฎไหน → work_layer2 = "อื่นๆ", metier = "NOT_APPLICABLE" (ห้ามเดามั่ว)
6. Metier priority: SOFTWARE DEVELOPMENT > CREATIVE PRODUCTION > MEDIA MANAGEMENT
   > MARKETING > NOT_APPLICABLE  (ใช้ keyword ใน §3)
7. work_category_layer1 ใช้ค่าใดค่าหนึ่งใน 7 หมวด (§2) — ครุภัณฑ์ทุกชนิด → "7. ครุภัณฑ์"
8. หลังรอบแรก: วนกลับมาแตกถัง "อื่นๆ" + "NOT_APPLICABLE" ตาม §5 (อ่าน theme แล้วตั้ง sub ใหม่)
9. ห้ามแต่งข้อมูล · ค่าที่ขาด string = "ไม่ทราบข้อมูลในส่วนนี้", ตัวเลข = null
10. เก็บค่าเก่าไว้ใน _prev_* ทุกครั้งที่เปลี่ยน เพื่อ audit + print diff หลังรัน

ส่งกลับเป็น JSON เดิม + 4 ฟิลด์นี้ และรายงาน: กี่ตัวเข้าแต่ละหมวด, กี่ตัวยังเป็น อื่นๆ/NOT_APPLICABLE
```

---

## 8. Checklist ตรวจคุณภาพการจัดกลุ่ม

- [ ] กฎเรียง priority ถูก (เฉพาะ→กว้าง) ไม่มีกฎกว้างดูดของหมวดเฉพาะ
- [ ] ทุกหมวดมี fallback · ไม่มี record ตกขอบ (error)
- [ ] ใส่ OCR variant ครบสำหรับ keyword สำคัญ
- [ ] Layer 2 ทุกค่าอยู่ใต้ Layer 1 อย่างสมเหตุผล
- [ ] ถัง `อื่นๆ`/`NOT_APPLICABLE` เหลือน้อยที่สุดเท่าที่ซื่อตรงได้ (ที่เหลือคือ truncated จริง ไม่ใช่ขี้เกียจแตก)
- [ ] run แล้ว deterministic (รันซ้ำ → ผลเดิม)
- [ ] มี diff report + เก็บ `_prev_*` ให้ตรวจย้อนได้
- [ ] ไม่ promote MARKETING แบบฝืน (ถ้าเอกสารไม่มี strategy ตรง ๆ ให้เป็น 0)

---

## 9. ตัวอย่าง worked examples (จากข้อมูลจริง)

| ชื่อโครงการ (ย่อ) | work L1 | work L2 | metier L1 | metier L2 |
|---|---|---|---|---|
| โครงการจัดกิจกรรมรัฐพิธีการรับเสด็จ | 1. บริหารจัดการ | ศาสนา-วัฒนธรรม | CREATIVE PRODUCTION | Event Marketing/Festival |
| ก่อสร้างถนน ค.สล. ซอย... | 2. โครงสร้างพื้นฐาน | ถนน-คอนกรีต | NOT_APPLICABLE | NOT_APPLICABLE |
| จัดทำวารสารเทศบาล | 1. บริหารจัดการ | วารสาร-สื่อสารองค์กร | MEDIA MANAGEMENT | Public Relations |
| พัฒนาแอปพลิเคชันบริการประชาชน | 1. บริหารจัดการ | Smart City/ดิจิทัล | SOFTWARE DEVELOPMENT | Mobile Application |
| จัดซื้อเครื่องคอมพิวเตอร์ | 7. ครุภัณฑ์ | ครุภัณฑ์-คอมพิวเตอร์/IT | SOFTWARE DEVELOPMENT | IT Hardware Procurement (less aligned) |
| ติดตั้งเสียงไร้สายชุมชน | 2. โครงสร้างพื้นฐาน | เสียงตามสาย-สื่อสารชุมชน | MEDIA MANAGEMENT | Offline Media |

---

*Reference: `output/extraction/s5c_reclassify.py` · ใช้คู่กับ `SOP.md` (วิธีคิดรวม) + `PROCESS.md` (ลำดับงาน) + `CLAUDE.md` (memory หลัก)*

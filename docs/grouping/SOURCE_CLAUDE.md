# CLAUDE.md — Khlong Luang × Metier 2026

> ไฟล์นี้คือ **memory หลัก** ของโปรเจกต์ Claude จะอ่านอัตโนมัติทุก session
> รายละเอียดเชิงลึกแยกไว้ 3 ไฟล์: `SOP.md` (วิธีคิด) · `PROCESS.md` (กระบวนการทำงาน) · `SKILL.md` (วิธีจัดกลุ่ม/sub-group)

---

## 1. โปรเจกต์นี้คืออะไร

วิเคราะห์ **แผนพัฒนาท้องถิ่นเทศบาลเมืองคลองหลวง พ.ศ. 2566–2570** เพื่อหาโครงการที่ **Metier (Thailand) Co.,Ltd.** มีโอกาสรับงาน + สร้าง web app ให้ทีมใช้ดู/คัดเลือก/ติดตามโครงการ

- **Working directory:** `/Users/ddoyle/Downloads/คลองหลวง_2026`
- **ภาษา output:** ไทย (user-facing) · English keys ได้สำหรับ JSON/column
- **ลูกค้า:** Metier — *"Where Marketing Meets Technology"* — 4 service areas:
  `MARKETING` · `MEDIA MANAGEMENT` · `CREATIVE PRODUCTION` · `SOFTWARE DEVELOPMENT`

โปรเจกต์มี **2 tracks ขนานกัน**
1. **Data analysis (S1→S11)** — extract + classify + score + match + report
2. **Web app (Next.js + Supabase)** — เครื่องมือ interactive 7 หน้า

---

## 2. กฎเหล็ก 5 ข้อ (ห้ามผิด)

1. **Adaptive workflow** — เสนอ workflow ก่อน → รอ user approval → execute **ทีละ step** → หยุดด้วย `step_review_schema` ทุกครั้ง · **ห้าม skip review gate**
2. **Source grounding** — ทุก factual claim ต้องอ้าง source ได้ (`source_pdf_file` + `source_page`) · ข้อมูลที่ขาดให้เขียน **`"ไม่ทราบข้อมูลในส่วนนี้"`** (เป๊ะ) · numeric/boolean ที่ขาด = `null`
3. **No fabrication** — ห้ามคิดเลขเอง ห้ามสร้าง citation ปลอม ห้ามอ้างไฟล์ที่ไม่ได้เปิด ห้ามเดาชื่อโครงการ
4. **Web CI** — ใช้แค่ `#ff5008` (orange, accent เท่านั้น) + `#000000` + `#ffffff` · font **IBM Plex Sans Thai** (Bold + Light) · พื้นหลัง**ขาวเสมอ** (ไม่ตาม OS dark mode)
5. **ห้าม reveal hidden chain-of-thought** — สรุปเหตุผลสั้น ๆ ได้ แต่ไม่เปิด reasoning ดิบ

---

## 3. State ปัจจุบัน (อัปเดตล่าสุด: หลัง S5c + web Phase 4)

### Data track
| Step | สถานะ | |
|---|---|---|
| S1–S5c | ✅ เสร็จ | inventory → dup detect → excel review → schema → extract → cross-check fix → re-classify |
| S6 | ⏳ | Merge & Reconciliation |
| S7 | ⏳ | Metier Fit Scoring (UI ทำใน web `/filter` แล้ว) |
| S8 | ⏳ | Historical match vs XLSX-04 (1,449 records) |
| S9 | ⏳ | SOW/TOR mapping |
| S10 | ⏳ | Deliverables D1 (xlsx) + D2/D3 (docx) |
| S11 | ⏳ | Final QA (13 ข้อ) |

### Web track
- ✅ Phase 1–4 เสร็จ: 7 หน้า (`/methodology` `/projects` `/groups` `/history-2568` `/filter` `/selected` `/status`)
- ⏳ ค้าง: apply Supabase migration → seed → swap data layer JSON→DB → sync localStorage→DB → Git push → Vercel deploy

### ตัวเลขปัจจุบัน (post-S5c)
- **1,333 records** ทั้งหมด / งบรวม ~25,368 ล้านบาท
- **68 Metier-relevant** (5.1%) / **577 ล้านบาท**
  - CREATIVE PRODUCTION 29 · SOFTWARE DEVELOPMENT 30 · MEDIA MANAGEMENT 9 · MARKETING 0
- NOT_APPLICABLE 1,265

---

## 4. ไฟล์สำคัญ

| ไฟล์ | คือ |
|---|---|
| `output/extraction/ALL_records_v2.json` | **DATA หลัก** 1,333 records (post-S5c) |
| `output/extraction/ALL_records_v2_pre_s5c_backup.json` | backup ก่อน S5c |
| `output/extraction/s5c_reclassify.py` | script จัดกลุ่ม (reproducible) — ดู logic ใน `SKILL.md` |
| `output/khlong_luang_master_workbook.xlsx` | 17 sheets, S6+ ยังว่าง |
| `2568 Project list/เทศบาลคลองหลวง 2568-05_2569.xlsx` | XLSX-04 procurement history (sheet `clean`, 1,449 rows) |
| `web/` | Next.js 16 app (dev server พร้อมใช้) |
| `Prompt.JSON` | runtime prompt รวม rules + sub-agent + multi-agent + state |
| `HANDOFF_FOR_NEXT_SESSION.md` | handoff เต็ม |

---

## 5. Schema (45 fields ต่อ record · จัดเป็น 13 กลุ่ม A–M)

A. ID & Source · B. Identity · C. Description · D. Ownership · E. Budget (`budget_2566`..`budget_2570` + `total_budget`) · F. Procurement · G. Audit (`extraction_confidence`, `qa_flag`, `missing_information`) · H. Change Tracking (`pair_id`, `duplicate_group_id`) · I. Metier Fit · J. Selection · K. Historical Match · L. Category & Year (`work_category_layer1/2`, `planned_years_list`) · M. Metier Service Area (`metier_service_area_layer1/2`)

**ID format:** `KL-{doc_code}-{year}-{original_id}` เช่น `KL-AD1-2568-P004`
(`AD1/2/3` = เพิ่มเติม ครั้งที่ 1/2/3 · `CH1/2` = เปลี่ยนแปลง ครั้งที่ 1/2)

---

## 6. การจัดกลุ่ม (ดู `SKILL.md` ฉบับเต็ม)

ข้อมูลจัดกลุ่ม **2 ระบบขนานกัน** แต่ละระบบมี 2 ชั้น:

1. **ระบบงานเทศบาล** — `work_category_layer1` (7 ยุทธศาสตร์/ครุภัณฑ์) → `work_category_layer2` (~50 ประเภทงานย่อย)
2. **ระบบโอกาส Metier** — `metier_service_area_layer1` (4 areas + NOT_APPLICABLE) → `metier_service_area_layer2` (sub-area)

**วิธีคิดหลัก:** keyword decision tree · ลำดับ priority สำคัญ (signal แรง/กว้างไว้บน) · **first-match-wins** · มี fallback (`อื่นๆ` / `NOT_APPLICABLE`) · เก็บ variant ที่ OCR สะกดผิดไว้ใน keyword list ด้วย (เช่น `ถมดิน`/`ถมติน`, `พัฒนา`/`หัฒนา`)

Web `/groups` = configurable: เลือก **primary dim × secondary dim × metric** เอง (9 dimensions × 4 metrics) ไม่ใช่ view ตายตัว

---

## 7. คำสั่งที่ใช้บ่อย

```bash
cd /Users/ddoyle/Downloads/คลองหลวง_2026

# ดูข้อมูล
python3 -c "import json; print(len(json.load(open('output/extraction/ALL_records_v2.json'))))"

# web app
cd web && npm install && npm run dev      # http://localhost:3000
npm run build
npm run data:build                         # refresh web/data/*.json จาก parent

# Supabase (MCP authenticated)
# apply web/supabase/migrations/0001_init.sql → npm run seed:all
```

---

## 8. User preferences (ยืนยันแล้ว)

| เรื่อง | ค่า |
|---|---|
| Selection scale | `metier_fit_score` 1–10 **+** tier high/medium/low (ทั้งคู่) |
| Duplicate | เก็บคู่ขนาน ไม่ตัดอัตโนมัติ |
| `/projects` | ต้องแยกงบ**ทุกปี** 2566–2570 (ไม่ใช่แค่ปีเริ่ม) |
| `/groups` | **ผู้ใช้ตั้งค่าจัดกลุ่มเอง** |
| `/selected` | **ไม่ auto-suggest** — admin ใส่ TOR + SOW manual |
| Persistence | localStorage (ก่อนมี DB) |
| Supabase project_ref | `kvnbtsadnnjszdiktbhb` (MCP authenticated) |

---

## 9. Known limitations (user อนุมัติแล้ว)

1. PDF-03 pp.1–65 + 311–312 ไม่ได้ extract (API 529 บล็อก sub-agent)
2. PDF-04 ครุภัณฑ์ 79 รายการ ใช้ค่าจาก XLSX-01 ไม่ verify เทียบ PDF
3. PDF-05 ครุภัณฑ์การแพทย์บางตัวเล็กมาก (~10K) แต่เก็บครบ
4. Metier MARKETING = 0 records (เอกสารราชการไม่มี Brand/Comm Strategy ตรง ๆ)
5. Git push ค้าง (403 — อาจไม่ใช่ collaborator)

---

## 10. เริ่ม session ใหม่อย่างไร

1. อ่านไฟล์นี้ (CLAUDE.md) → `Prompt.JSON` → `HANDOFF_FOR_NEXT_SESSION.md`
2. ตรวจ `output/extraction/ALL_records_v2.json`
3. **ถาม user เลือก track** (data S6→S11 / web deploy / ทั้งคู่) — **ห้ามเริ่มทำเองโดยไม่ propose+approve**
4. เสนอ `workflow_review_schema` → รอ approve → execute ทีละ step

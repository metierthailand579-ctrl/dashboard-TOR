# PROCESS — กระบวนการทำงานทั้งหมดที่เราทำกัน

> บันทึก **"ทำอะไร ตามลำดับไหน ได้ผลอะไร"** ตลอดโปรเจกต์ — ทั้ง data track (S1→S11) และ web track (Phase 1→4)
> "คิดอย่างไร" ดู `SOP.md` · "จัดกลุ่มอย่างไร" ดู `SKILL.md`

---

## ภาพรวม pipeline

```
PDF/Excel ต้นทาง
   │  S1  inventory
   ▼
รู้ว่ามีไฟล์อะไร ใช้ได้ไหม ซ้ำกันไหม
   │  S2  duplicate detection
   ▼
รู้กลุ่มซ้ำ (DUP-001..006) + XLSX-04 = procurement
   │  S3  review excel เดิม
   ▼
รู้ว่า excel ของ user เชื่อได้แค่ไหน (sample 3/3 PASS)
   │  S4  ออกแบบ master schema
   ▼
schema 45 fields × 13 กลุ่ม (A–M)
   │  S5  extract → S5b cross-check fix → S5c re-classify
   ▼
ALL_records_v2.json — 1,333 records, 68 Metier-relevant   ◄── อยู่ตรงนี้
   │  S6  merge & reconcile  (⏳ ค้าง)
   │  S7  metier fit scoring  (⏳ UI ทำใน web แล้ว)
   │  S8  historical match vs XLSX-04  (⏳)
   │  S9  SOW/TOR mapping  (⏳)
   │  S10 deliverables D1/D2/D3  (⏳)
   │  S11 final QA  (⏳)
   ▼
รายงาน + เครื่องมือพร้อมเสนอ Metier
```

---

## DATA TRACK — รายละเอียดแต่ละ step

### S1 — File Inventory ✅
- **ทำ:** สำรวจไฟล์ทั้งหมด 10 ไฟล์ (6 PDF + 4 XLSX) รวม 764 หน้า PDF
- **ผล:** ตาราง inventory + สถานะ accessibility + ตัวบ่งชี้ความซ้ำ
- **ไฟล์ต้นทาง:**
  - PDF-01 เปลี่ยนแปลง ครั้งที่ 1/2568 (44 หน้า, `CH1`)
  - PDF-02 เปลี่ยนแปลง ครั้งที่ 2/2568 (12 หน้า, `CH2`)
  - PDF-03 เพิ่มเติม ครั้งที่ 1/2568 (312 หน้า, `AD1`)
  - PDF-04 เพิ่มเติม ครั้งที่ 1/2569 (119 หน้า, `AD1`)
  - PDF-05 เพิ่มเติม ครั้งที่ 2/2568 (188 หน้า, `AD2`)
  - PDF-06 เพิ่มเติม ครั้งที่ 3/2568 (89 หน้า, `AD3`)
  - XLSX-01/02/03 = excel ที่ user เคยทำ · XLSX-04 = procurement history

### S2 — Duplicate / Overlap Detection ✅
- **ทำ:** หาไฟล์/เนื้อหาที่ทับซ้อน
- **ผล:** 6 dup groups (DUP-001..006) + ระบุว่า XLSX-04 = บันทึกจัดซื้อจัดจ้างจริง (ไม่ใช่แผน) → กันไว้ใช้ S8

### S3 — Existing Excel Review ✅
- **ทำ:** ตรวจ excel 3 ไฟล์ของ user **ก่อนเอามาใช้** (ไม่เชื่อทันที)
- **ผล:** เจอ schema 2 รุ่น + sample verification 3/3 PASS → excel ใช้ได้แต่ต้องรวม schema

### S4 — Master Schema Design ✅
- **ทำ:** ออกแบบ schema กลางครอบทุก source
- **ผล:** **45 fields จัด 13 กลุ่ม A–M** (ID/Source, Identity, Description, Ownership, Budget, Procurement, Audit, Change-tracking, Metier-fit, Selection, Historical-match, Category-year, Metier-service-area)
- **ID convention:** `KL-{doc_code}-{year}-{original_id}`

### S5 — Document Extraction (v1) ✅
- **ทำ:** ดึงข้อมูลทุก PDF เข้า schema ด้วย vision-first
- **ผล:** 937 records (v1) · ไฟล์ `PDF-0X_projects.json` รายไฟล์
- **scripts:** `build_pdf01.py`, `extract_pdf05.py`, `build_pdf05_json.py`, + `output/pdf_images/PDF-03/*.py`

### S5b — Cross-check Fix (v2) ✅
- **ทำ:** team cross-check รายไฟล์ → ไฟล์ NOT_PASS ทำ v2 re-extraction + merge
  - PDF-01 PASS · PDF-02 PASS · PDF-06 PASS
  - PDF-03 NOT_PASS → v2 (`PDF-03_projects_v2_merged.json`)
  - PDF-04 NOT_PASS → v2 (+79 ครุภัณฑ์จาก XLSX-01)
  - PDF-05 NOT_PASS → v2 (+311 unrolled equipment line items)
- **ผล:** **1,333 records** (v2) + Metier classification รอบแรก → 62 Metier-relevant
- **ไฟล์:** `ALL_records_v2.json`

### S5c — Re-classify "อื่นๆ" + Metier re-check ✅
- **ทำ:** รัน `output/extraction/s5c_reclassify.py` (backup ก่อนด้วย `ALL_records_v2_pre_s5c_backup.json`)
  - **Pass 1:** re-check Metier ทั่ว NOT_APPLICABLE → +6 promotions (วารสาร→PR, แอปพลิเคชัน→Mobile App, เสียงไร้สาย→Offline Media)
  - **Pass 2:** แตก `อื่นๆ` 114 → 26 sub-category ใหม่ (105 ย้ายออก, เหลือ 11 ชื่อ truncated)
- **ผล:** **68 Metier-relevant / 577 ล้านบาท** (ตัวเลขปัจจุบัน)

| Metier area | count | budget (บาท) |
|---|--:|--:|
| CREATIVE PRODUCTION | 29 | 335,258,000 |
| SOFTWARE DEVELOPMENT | 30 | 157,061,200 |
| MEDIA MANAGEMENT | 9 | 84,750,000 |
| MARKETING | 0 | 0 |
| NOT_APPLICABLE | 1,265 | 24,791,073,898 |

### S6 — Merge & Reconciliation ⏳ (ค้าง)
- cross-PDF dup detection (name + budget + dept)
- normalize ชื่อหน่วยงาน (สํานักปลัด vs สำนักปลัดเทศบาล ฯลฯ)
- re-sequence `master_project_id` ให้ unique ทั้ง dataset
- เชื่อม `duplicate_group_id` ↔ Sheet 02 (DUP-001..006)
- เชื่อม `pair_id` (31 ของ PDF-01, 7 ของ PDF-02)
- populate Sheet 06 ใน master workbook

### S7 — Metier Fit Scoring & Selection ⏳
- ให้ `metier_fit_score` 1–10 + `metier_fit_tier` high/medium/low
- UI การเลือกทำใน web `/filter` แล้ว (localStorage) → sync เข้า Supabase หลัง migration

### S8 — Historical Comparison vs XLSX-04 ⏳
- fuzzy match โครงการที่เลือก vs 1,449 procurement records (sheet `clean`)
- **ตัดสินใจ:** ทำ matching ใน data analysis (web app ถอด auto-suggest ออกตามที่ user ขอ)

### S9 — SOW/TOR Component Mapping ⏳
- รอ user download TOR ของ historical matches → parse แยก source-grounded vs inferred → Sheet 10

### S10 — Deliverables ⏳
- D1 = polish `khlong_luang_master_workbook.xlsx`
- D2 = DOCX comparison (ไทย) · D3 = DOCX exec summary 1–2 หน้า (ไทย)

### S11 — Final QA ⏳
- เดิน checklist 13 ข้อ → go/no-go

---

## WEB TRACK — รายละเอียดแต่ละ phase

### Phase 1 — Scaffold + CI ✅
- Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn-style primitives
- Metier CI: orange `#ff5008` + IBM Plex Sans Thai + พื้นหลังขาว
- Supabase schema (`web/supabase/migrations/0001_init.sql`: 7 tables + enums + RLS + view `v_project_full`)
- seed scripts (`scripts/seed-projects.ts`, `seed-history.ts`, `build-local-data.ts`)

### Phase 2 — Pages 1–3 ✅
- `/methodology` — storytelling S1→S11 + animated counter + pipeline diagram + glossary
- `/projects` — 1,333 records + **แยกงบทุกปี 2566–2570** + filter + sort + pagination
- `/groups` — **configurable** Group/Sub/Metric (9 dims × 4 metrics) + treemap + drill-down

### Phase 3 — Pages 4–5 ✅
- `/history-2568` — 1,449 procurement + top-10 bar chart + filter
- `/filter` — sidebar filter + checkbox เลือก + sticky live summary (count + ฿ + pie + top dept) + localStorage

### Phase 4 — Pages 6–7 ✅
- `/selected` — การ์ดต่อโครงการ: TOR refs (admin ใส่ manual) + SOW items (manual) + ปุ่ม Confirm
- `/status` — Kanban 5 คอลัมน์ (ร่าง TOR → เปิดโครงการ → ยื่นโครงการ → กำลังดำเนินงาน → เสร็จสิ้น) drag-drop + timeline log

### Polish round 1 ✅
- per-year columns, custom grouping, manual TOR/SOW (ถอด auto-suggestion ออกตามที่ user ขอ)

### ค้าง (pre-deploy) ⏳
1. apply Supabase migration ผ่าน MCP (authenticated แล้ว)
2. ใส่ keys ใน `web/.env.local`
3. `npm run seed:all` → projects 1,333 + procurement 1,449
4. swap data layer `lib/data/projects.ts` + `history.ts` จาก JSON → Supabase
5. sync localStorage (selections/sow/confirmations/status) → Supabase
6. Git push (แก้ 403 ด้วย PAT/gh CLI/repo ใหม่) → Vercel deploy (Root Directory = `web`)

---

## ข้อมูลสำคัญสำหรับงานต่อ

**โครงสร้างโฟลเดอร์:**
```
คลองหลวง_2026/
  File Project/          6 PDF ต้นฉบับ
  Excel/                 XLSX-01/02/03 (excel เดิม user)
  2568 Project list/     XLSX-04 procurement history
  output/
    extraction/          ALL_records_v2.json (หลัก) + per-PDF json + scripts
    pdf_images/, pdf_text/   intermediate OCR
    per_pdf/             cross-check xlsx รายไฟล์
    khlong_luang_master_workbook.xlsx   17 sheets
  web/                   Next.js app + metier-klongluang/ (git repo copy)
  CLAUDE.md SOP.md PROCESS.md SKILL.md   ◄── เอกสารชุดนี้
  Prompt.JSON HANDOFF_FOR_NEXT_SESSION.md TRANSFER.md
```

**Environment:** macOS · Python 3.13 (openpyxl 3.1.5) · Node 24.11 (Next 16.2.6, React 19.2, Tailwind 4) · tesseract 5.5.2 Thai · pdftoppm/pdftotext · Supabase MCP (`kvnbtsadnnjszdiktbhb`, authenticated)

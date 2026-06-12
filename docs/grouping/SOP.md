# SOP — วิธีคิดทั้งหมด (Standard Operating Procedure of Reasoning)

> เอกสารนี้บันทึก **"วิธีคิด"** ที่ใช้ตลอดโปรเจกต์ Khlong Luang × Metier 2026 — ไม่ใช่แค่ "ทำอะไร" แต่คือ **"คิดอย่างไรก่อนทำ"** ในแต่ละประเภทการตัดสินใจ
> สำหรับ "ลำดับงานที่ทำจริง" ดู `PROCESS.md` · สำหรับ "วิธีจัดกลุ่ม" ดู `SKILL.md`

---

## หลักการแม่ (Master Principles) — ใช้กับทุกอย่าง

1. **Propose before execute** — งานซับซ้อนหลาย step ต้องเสนอแผนก่อน รอ approve ก่อนลงมือ
2. **Ground everything** — ทุกข้อความที่เป็นข้อเท็จจริงต้องชี้ที่มาได้ · ไม่มีที่มา = `"ไม่ทราบข้อมูลในส่วนนี้"`
3. **Evidence over inference** — แยก "ข้อมูลจากเอกสาร" ออกจาก "ที่เราอนุมาน" ให้ชัดเสมอ
4. **Reproducible over manual** — ถ้าทำซ้ำได้ ให้เขียนเป็น script (เช่น `s5c_reclassify.py`) ไม่ใช่แก้มือทีละ record
5. **Reversible over destructive** — แก้ข้อมูลจริงต้อง backup ก่อน (เช่น `ALL_records_v2_pre_s5c_backup.json`)
6. **Stop and review** — หยุดให้ user ตรวจหลังทุก step สำคัญ ไม่รวบยอด

---

## A. วิธีคิดเรื่อง Adaptive Workflow (การวางแผนงาน)

**ปัญหาที่แก้:** งาน analysis ยาว 11 step ถ้าทำรวดเดียวแล้วผิดตั้งแต่ step ต้น ๆ จะเสียทั้งสาย

**วิธีคิด:**
- มองงานเป็น **pipeline ที่ทุก step มี input/output ชัดเจน** — output ของ step นี้คือ input ของ step ถัดไป
- ก่อน execute ใด ๆ → ออก `workflow_review_schema` (เสนอทุก step + objective + risk + คำถาม) → รอ user เลือก keep/edit/add/remove/reorder/approve
- หลังแต่ละ step → ออก `step_review_schema` (สรุปสิ่งที่ทำ + ที่ขาด + ที่ไม่แน่ใจ + preview step ถัดไป) → รอ user เลือก continue/revise/go-back/change-direction
- **เกณฑ์ตัดสินว่า "ต้องหยุดถาม"**: เมื่อ (ก) ต้องใช้ข้อมูลที่มีแต่ user รู้ (ข) มีทางเลือกที่เปลี่ยนทิศงาน (ค) เจอ conflict ที่ตัดสินเองไม่ได้
- **เกณฑ์ตัดสินว่า "เดินต่อได้เลย"**: งานมีค่า default ชัด + reversible + ไม่เปลี่ยนทิศ

**ผลที่ได้:** user คุมทิศทุกจุด · ความผิดพลาดถูกจับตั้งแต่ step ที่เกิด ไม่ลามทั้ง pipeline

---

## B. วิธีคิดเรื่อง Source Grounding (ความน่าเชื่อถือ)

**ปัญหาที่แก้:** เอกสารราชการเยอะ + OCR เพี้ยน → เสี่ยงเดา/แต่งข้อมูล

**ลำดับความน่าเชื่อถือของ source (สูง→ต่ำ):**
1. PDF ต้นฉบับ Khlong Luang (PDF-01..06)
2. Excel 3 ไฟล์ที่ user ทำไว้ — **verify ก่อน trust** (ไม่เชื่อทันที)
3. XLSX-04 procurement history (สำหรับ S8)
4. Metier credentials PDF
5. Secondary sources — เฉพาะที่ user อนุญาต

**กฎปฏิบัติ:**
- ทุก record ฝัง `origin_file_id` + `source_pdf_file` + `source_page` ไว้เสมอ → ตรวจสอบย้อนได้
- string ที่หาไม่เจอ → `"ไม่ทราบข้อมูลในส่วนนี้"` (เป๊ะ ห้ามดัดแปลง) · ตัวเลข/boolean ที่ขาด → `null`
- merge หลาย source → list ทุกที่มา + flag ถ้าขัดกัน ส่งให้ orchestrator ตัดสิน
- เก็บ `original_text_excerpt` (ข้อความดิบที่ตัดมา) ไว้คู่กับข้อมูลที่ตีความแล้ว → ตรวจสอบได้ว่าตีความถูกไหม

**Anti-hallucination checklist (ท่องก่อนเขียนทุก factual claim):**
- [ ] ตัวเลขนี้มาจากไฟล์ไหน หน้าไหน?
- [ ] ฉันเปิดไฟล์นั้นจริงหรือยัง?
- [ ] ถ้าไม่มี — เขียน `"ไม่ทราบข้อมูลในส่วนนี้"` แล้วหรือยัง?
- [ ] citation นี้มีอยู่จริง ไม่ได้ประดิษฐ์?

---

## C. วิธีคิดเรื่องการ Extract เอกสาร (S5)

**ปัญหาที่แก้:** PDF ราชการ = ตารางสแกน ภาษาไทย เลขหน้าเยอะ (รวม 764 หน้า)

**วิธีคิด:**
- **Vision-first** — ใช้ Read tool + `pages` param (Claude อ่านภาพ native) เป็นหลัก · tesseract Thai เป็น backup
- **สร้าง evidence index ก่อนวิเคราะห์** — รู้ก่อนว่าเอกสารแต่ละหน้าคืออะไร (แบบ ผ.01/ผ.02, ยุทธศาสตร์ไหน) ก่อนดึง record
- ดึงให้ตรง schema ทันที (45 fields) ไม่ใช่ดึงดิบแล้วค่อยจัด → ลดงานซ้ำ
- แต่ละ record ติด `extraction_confidence` (high/medium/low) ตามความชัดของต้นฉบับ
- field ที่อ่านไม่ออก/ตารางเพี้ยน → `qa_flag` + `reviewer_notes` ไว้ ไม่ปล่อยผ่านเงียบ ๆ

**เมื่อ extract แล้วเจอปัญหา (เช่น sub-agent โดน API 529):** บันทึกเป็น **known limitation ที่ user อนุมัติ** ไม่แกล้งทำว่าครบ

---

## D. วิธีคิดเรื่องการ Verify / Cross-check (S5b)

**ปัญหาที่แก้:** extract เสร็จไม่ได้แปลว่าถูก — ต้องพิสูจน์

**วิธีคิด — 2 ชั้น:**
1. **Sample verification** — สุ่ม record เทียบกับต้นฉบับทีละตัว (เคยทำ 3/3 PASS ใน S3) → ยืนยัน schema mapping ถูก
2. **Team cross-check รายไฟล์** — ตรวจทั้ง PDF ว่าจำนวน record + งบ + โครงสร้างครบไหม → ให้ผล `PASS` / `NOT_PASS`
   - `NOT_PASS` → ทำ **v2 re-extraction** เฉพาะส่วนที่ขาด แล้ว **merge v1+v2** โดยเลือกตัวที่คุณภาพดีกว่า (เช่น PDF-03 ใช้ v2 สำหรับ pp.66–85 เพราะอ่านชัดกว่า — บันทึกใน `reviewer_notes`)

**ผลจริง:** PDF-01/02/06 PASS · PDF-03/04/05 NOT_PASS → fix v2 (+79 ครุภัณฑ์ PDF-04, +311 unrolled equipment PDF-05)

**หลักคิด:** record count เพิ่มจาก 937 (v1) → 1,333 (v2) **เป็นเรื่องดี** เพราะแปลว่าจับของที่เคยตกได้ ไม่ใช่ inflate

---

## E. วิธีคิดเรื่อง Classification (จัดประเภท) — ดูเต็มใน SKILL.md

**ปัญหาที่แก้:** 1,333 โครงการ ต้องรู้ (1) เป็นงานประเภทไหนของเทศบาล (2) Metier ทำได้ไหม

**วิธีคิดหลัก — Keyword Decision Tree:**
- เรียงกฎตาม **priority**: signal ที่ **แรงและเฉพาะ** ไว้บน, signal กว้าง ๆ ไว้ล่าง
- **first-match-wins** — กฎแรกที่ตรงชนะ หยุดทันที
- มี **fallback เสมอ** — ไม่ตรงอะไรเลย → `อื่นๆ` (งานเทศบาล) / `NOT_APPLICABLE` (Metier)
- **2 ระบบขนาน 2 ชั้น**: งานเทศบาล (layer1→layer2) + โอกาส Metier (layer1→layer2)

**สิ่งที่ทำให้แม่นกับเอกสารไทยที่ OCR เพี้ยน:**
- ใส่ **variant สะกดผิดจาก OCR** ลง keyword list ด้วย เช่น `ถมดิน`+`ถมติน`, `พัฒนา`+`หัฒนา`, `ดับเพลิง`+`คับเพลิง`+`ดับเหลิง`, `ศูนย์พัฒนา`+`ศูนย์หัฒนา`
- match ทั้งข้อความดิบ (Thai case-preserved) และ lowercase (สำหรับคำอังกฤษปน)
- ค้นใน `project_name_th` + `objective_or_rationale` รวมกัน (haystack เดียว)

**S5c — การ re-classify ถังขยะ "อื่นๆ":**
- ถัง `NOT_APPLICABLE` + `อื่นๆ` คือ "ยังไม่ได้คิด" ไม่ใช่ "คิดแล้วว่าไม่มีหมวด"
- 2 pass: (1) re-check Metier ทั่ว NOT_APPLICABLE หา content/PR/app ที่ตกหล่น → promote (2) แตก `อื่นๆ` 114 ตัว เป็น 26 sub-category ใหม่
- ผล: +6 Metier promotions, 105/114 ย้ายออกจาก อื่นๆ, เหลือ 11 (ชื่อ truncated จริง ๆ)

---

## F. วิธีคิดเรื่อง Confidence & QA Flagging

**หลักคิด:** ไม่ใช่ทุก record เท่ากัน — ต้องบอก user ว่าอันไหนเชื่อได้แค่ไหน

- `extraction_confidence`: `high` (ต้นฉบับชัด ตารางครบ) / `medium` (อ่านได้แต่บางช่องเพี้ยน) / `low` (เดาโครงสร้าง/ชื่อขาด)
- `qa_flag`: ใส่เมื่อมีอะไรต้องให้คนตรวจ (เช่น งบไม่ลงตัว, ชื่อ truncated, ตารางข้ามหน้า)
- `missing_information`: ระบุ field ที่ขาดเป็นข้อความ ไม่ปล่อยให้ user เดาเองว่าทำไม null
- `reviewer_notes`: ร่องรอยการตัดสินใจ (เช่น "v2 used for pp.66-85 (better quality)")

**กฎ:** mark low-confidence ดีกว่าแกล้งมั่นใจ — user เลือกได้ว่าจะ trust หรือ re-check

---

## G. วิธีคิดเรื่อง Multi-Agent (เมื่อแบ่งงาน)

สถาปัตยกรรม **orchestrator + workers + review gates** (A00 คุม, A01–A12 specialist)

**หลักคิดการ handoff:**
- ทุก output ของ agent ต้องมี source reference
- agent ที่รับงานต่อ **verify required fields ก่อนใช้** ไม่เชื่อ blind
- conflict → ส่งกลับ orchestrator ตัดสินด้วย evidence hierarchy
- Web App Implementer (A12) อ่านจาก `ALL_records_v2.json` หรือ Supabase **เท่านั้น** — ไม่อ่าน PDF ดิบ (แยก concern)

**บทเรียนจริง:** sub-agent ผ่าน general-purpose เคยล้มด้วย API 529 → fallback มาทำใน main session แทน · อย่าพึ่ง parallel agent กับงานที่ต้องเสถียร

---

## H. วิธีคิดเรื่อง Web App (เมื่อทำ visual)

**หลักคิด CI = ข้อจำกัดที่ทำให้ดูเป็นมืออาชีพ:**
- สี 3 สีเท่านั้น · orange เป็น accent ห้ามแตะ body copy · พื้นหลังขาวเสมอ
- typography จำกัด (Bold + Light, 4 ขนาด: 32/24/18/16) → ความสม่ำเสมอ > ความหลากหลาย

**หลักคิด UX จาก user feedback (สำคัญ):**
- **ไม่ auto-suggest** ในหน้า `/selected` — user ต้องการคุมเอง (admin ใส่ TOR/SOW manual) → "ระบบช่วยคิด" ไม่เท่ากับ "ระบบคิดแทน"
- **configurable > predefined** ในหน้า `/groups` — ให้เครื่องมือจัดกลุ่ม ไม่ใช่ยัดมุมมองสำเร็จรูป
- **แยกงบทุกปี** ใน `/projects` — granularity ที่ user ขอ สำคัญกว่าความกระชับ

**บทเรียน:** ฟีเจอร์ "ฉลาด" ที่ user ไม่ได้ขอ (auto fuzzy-match TOR) ถูกสั่งให้ถอดออก → **ทำตามที่ขอ ไม่ over-engineer**

---

## I. วิธีคิดเรื่อง Deliverables (S10)

- D1 = Excel workbook (machine-readable + audit trail)
- D2 = DOCX comparison report (ไทย, สำหรับอ่าน)
- D3 = DOCX exec summary 1–2 หน้า (ไทย, สำหรับผู้บริหาร)
- หลักคิด: **3 ระดับความละเอียดสำหรับ 3 ผู้อ่าน** — data team / project team / executive

---

## J. วิธีคิดเรื่อง Final QA (S11) — checklist 13 ข้อ

ตรวจครบทั้ง pipeline: ไฟล์ครบ → dup flag → excel verified → data + source ครบ → conflict logged → unique IDs → candidate แยก → rationale ผูก Metier fit → historical grounded → SOW grounded-vs-inferred → ไทยชัด → ไม่เผย CoT → review gate ครบ

**หลักคิด:** QA ไม่ใช่ "ดูผ่าน ๆ" แต่คือ **เดิน checklist ทีละข้อ + ให้ go/no-go**

---

## สรุปวิธีคิดเป็นประโยคเดียว

> **เสนอก่อนทำ · อ้างที่มาทุกอย่าง · แยกข้อเท็จจริงจากการเดา · ทำให้ทำซ้ำได้ · backup ก่อนแก้ · หยุดให้ตรวจทุก step · ไม่แต่ง ไม่เดา ไม่ over-engineer**

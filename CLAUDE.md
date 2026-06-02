# CLAUDE.md — TOR Website (ระบบเปิดดูเอกสาร TOR จัดซื้อจัดจ้าง)

> ไฟล์นี้คือ "สมองสั่งการ" ของ AI สำหรับโปรเจกต์นี้
> อ่านไฟล์นี้ก่อนเริ่มงานทุกครั้ง แล้ว **route ไปโหลด skill ที่เกี่ยวข้อง** จาก `skills/<name>/SKILL.md`

---

## 1. โปรเจกต์นี้คืออะไร

เว็บไซต์ **แสดงและค้นหาเอกสาร TOR (Terms of Reference) งานจัดซื้อจัดจ้าง** ของหน่วยงาน
ผู้ใช้เข้ามาเพื่อ **ไล่ดูตามหมวด → เปิด/ดาวน์โหลดไฟล์ PDF** ของแต่ละโครงการ

แหล่งข้อมูลตั้งต้น: `โครงสร้างโฟลเดอร์_รวม_TOR.xlsx` (2 ชีต)

### โครงสร้างข้อมูล 3 ระดับ
```
ประเภทการจัดซื้อจัดจ้าง → ช่วงวงเงินงบประมาณ → โครงการ (โฟลเดอร์ + ไฟล์ PDF)
```

| ระดับ | ค่าที่เป็นไปได้ |
|------|----------------|
| **ประเภท** | ซื้อ · เช่า · จ้างก่อสร้าง · จ้างเหมาบริการ |
| **ช่วงวงเงิน** | ไม่เกิน 500,000 · 500,000–5,000,000 · 5,000,000–500,000,000 · มากกว่า 500,000,000 บาท |
| **โครงการ** | รหัสโครงการ + ชื่อโครงการ + รายการไฟล์ PDF |

### Data model (ยึดตามชีต "รายการโครงการทั้งหมด")
```ts
type ProcurementType = 'ซื้อ' | 'เช่า' | 'จ้างก่อสร้าง' | 'จ้างเหมาบริการ';

interface Project {
  order: number;            // ลำดับ
  type: ProcurementType;    // ประเภท
  budgetRange: string;      // ช่วงวงเงิน
  code: string;             // รหัสโครงการ (เช่น "68109277503")
  name: string;             // ชื่อโครงการ (โฟลเดอร์)
  fileCount: number;        // จำนวนไฟล์
  fileTypes: string[];      // ชนิดไฟล์ (เช่น [".pdf"])
  files: string[];          // รายชื่อไฟล์ (เช่น ["TOR.pdf", "doc_..._69039482076.pdf"])
}
```
> ชีต "ภาพรวม" = ตารางสรุปจำนวนโครงการ/ไฟล์ ต่อ (ประเภท × ช่วงวงเงิน) → ใช้ทำหน้า Dashboard

---

## 2. Tech Stack

| ชั้น | เลือกใช้ | เหตุผล |
|------|---------|--------|
| Framework | **Next.js 14+ (App Router)** | SSR/SEO ดี, route ตามหมวดง่าย |
| Language | **TypeScript** (strict) | type ปลอดภัย |
| UI | **Tailwind CSS** + shadcn/ui | สร้าง UI เร็ว, รองรับภาษาไทย |
| Data | อ่าน Excel → แปลงเป็น JSON ตอน build (`/data/projects.json`) | data เป็น static ไม่ต้องมี DB |
| ไฟล์ PDF | เก็บใน `/public/docs/<code>/` หรือ object storage | เปิด/ดาวน์โหลดตรง |
| Deploy | Vercel | คู่กับ Next.js |

> ยังไม่ต้องมี database/login ในเฟสแรก — เป็นเว็บอ่านอย่างเดียว (read-only catalog)

---

## 3. วิธีใช้ Skills (หัวใจของ AI scaffold)

โฟลเดอร์ `skills/` มี **67 skill** แต่ละอันคือผู้เชี่ยวชาญเฉพาะด้าน
**กฎ:** ก่อนลงมือเขียนโค้ดส่วนไหน → เปิด `skills/<name>/SKILL.md` ที่ตรงงานนั้นก่อน แล้วทำตาม Core Workflow + Constraints ของมัน

### Skills หลักของโปรเจกต์นี้ (โหลดเสมอเมื่อแตะส่วนที่เกี่ยว)
| งาน | Skill | โหลดเมื่อ |
|-----|-------|----------|
| โครงสร้าง Next.js, routing, SEO, deploy | `nextjs-developer` | ทำหน้าเว็บ, layout, metadata |
| React component / state / hooks | `react-expert` | สร้าง UI component |
| TypeScript types, generics, strict | `typescript-pro` | นิยาม type, แก้ type error |
| สกัด spec/requirement จากเอกสาร TOR | `spec-miner` | เริ่มงาน, แปลง TOR → requirement |
| แตกฟีเจอร์เป็นงานย่อย | `feature-forge` | วางแผนฟีเจอร์ใหม่ |
| งานเต็ม stack + ความปลอดภัย | `fullstack-guardian` | ถ้าต่อ backend/API/ฟอร์ม |
| เขียนเทส | `test-master` · `playwright-expert` | unit/E2E test |
| รีวิวโค้ด / ความปลอดภัย | `code-reviewer` · `security-reviewer` | ก่อน merge |
| เอกสารโค้ด | `code-documenter` | เขียน README/คอมเมนต์ |
| ดีบัก | `debugging-wizard` | ไล่บั๊ก |

### แผนที่ Skill ทั้งหมด (เผื่อขยายระบบ)
- **frontend**: nextjs-developer, react-expert, vue-expert(-js), angular-architect, flutter-expert, react-native-expert
- **backend**: fastapi-expert, nestjs-expert, django-expert, laravel-specialist, rails-expert, spring-boot-engineer, dotnet-core-expert
- **language**: typescript-pro, javascript-pro, python-pro, golang-pro, rust-engineer, java-architect, php-pro, sql-pro, csharp-developer, kotlin-specialist, swift-expert, cpp-pro
- **api-architecture**: api-designer, architecture-designer, graphql-architect, microservices-architect, websocket-engineer, mcp-developer
- **infrastructure**: postgres-pro, database-optimizer, cloud-architect, kubernetes-specialist, terraform-engineer
- **devops**: devops-engineer, sre-engineer, monitoring-expert, chaos-engineer, cli-developer
- **quality**: code-reviewer, test-master, playwright-expert, debugging-wizard, code-documenter
- **security**: fullstack-guardian, secure-code-guardian, security-reviewer
- **data-ml**: rag-architect, ml-pipeline, pandas-pro, prompt-engineer, spark-engineer, fine-tuning-expert
- **platform**: wordpress-pro, shopify-expert, salesforce-developer, atlassian-mcp
- **workflow**: spec-miner, feature-forge, the-fool
- **specialized**: legacy-modernizer, game-developer, embedded-systems

> รูปแบบ SKILL.md ทุกอันเหมือนกัน: `Core Workflow` → `Reference Guide` (ตารางโหลดเพิ่มตามบริบท) → `Constraints (MUST/MUST NOT)` → `Code Examples`

---

## 4. ลำดับการทำงาน (Workflow)

```
1. เข้าใจข้อมูล   → spec-miner: อ่าน Excel, ยืนยัน data model ในข้อ 1
2. แปลงข้อมูล     → pandas-pro/script: Excel → /data/projects.json + overview.json
3. วางสถาปัตยกรรม → nextjs-developer: ออกแบบ route + หน้าจอ (ข้อ 5)
4. สร้าง UI       → react-expert + typescript-pro + Tailwind
5. ค้นหา/กรอง     → filter ฝั่ง client (ประเภท, ช่วงวงเงิน, คำค้น)
6. เทส           → test-master (unit) + playwright-expert (E2E เปิด/ดาวน์โหลดไฟล์)
7. รีวิว          → code-reviewer + security-reviewer
8. Deploy        → nextjs-developer: next build → Vercel
```

### หน้าจอที่ต้องมี (เฟสแรก)
| Route | หน้า | ข้อมูล |
|-------|------|--------|
| `/` | Dashboard ภาพรวม | ตารางสรุปจากชีต "ภาพรวม" + การ์ดสถิติ |
| `/type/[type]` | รายการตามประเภท | กรองตาม ประเภท + ช่วงวงเงิน |
| `/project/[code]` | รายละเอียดโครงการ | ชื่อ, รหัส, รายการไฟล์ PDF + ปุ่มดาวน์โหลด |
| `/search` | ค้นหา | ค้นจากชื่อ/รหัสโครงการ |

---

## 5. โครงสร้างโปรเจกต์ (เป้าหมาย)
```
tor-website/
├── CLAUDE.md                     # ไฟล์นี้
├── โครงสร้างโฟลเดอร์_รวม_TOR.xlsx  # ข้อมูลตั้งต้น
├── skills/                       # คลัง skill (อ้างอิงเท่านั้น ห้ามแก้)
├── scripts/
│   └── build-data.ts             # แปลง xlsx → JSON
├── data/
│   ├── projects.json             # 140 โครงการ
│   └── overview.json             # ตารางสรุป
├── public/docs/<code>/...pdf     # ไฟล์ TOR
├── src/
│   ├── app/                      # App Router (หน้าตามข้อ 4)
│   ├── components/               # UI components
│   ├── lib/                      # data loaders, utils
│   └── types/                    # Project, ProcurementType ...
└── tests/
```

---

## 6. ข้อกำหนด (Constraints)

### ต้องทำ
- ใช้ **App Router** (`src/app/`) + Server Components เป็นหลัก เพิ่ม `'use client'` เฉพาะส่วน interactive (ค้นหา/กรอง)
- รองรับ **ภาษาไทย** เต็มรูปแบบ: ฟอนต์ไทย (`next/font`), `lang="th"`, encoding UTF-8
- ทุกหน้าใส่ `generateMetadata` เพื่อ SEO (ชื่อโครงการเป็น title)
- ชื่อโครงการในข้อมูลจริง **ยาวและถูกตัด** — เก็บชื่อเต็มไว้, แสดงแบบ truncate + tooltip
- รหัสโครงการ (`code`) ใช้เป็น key/route param — ต้อง unique
- ไฟล์ PDF: เปิดในแท็บใหม่ + มีปุ่มดาวน์โหลด, จัดการกรณีไฟล์หาย (404)

### ห้ามทำ
- ห้ามแก้ไฟล์ใน `skills/` (เป็น reference เท่านั้น)
- ห้าม hardcode ข้อมูลโครงการในโค้ด — อ่านจาก `/data/*.json` เสมอ
- ห้ามใช้ `<img>` ธรรมดา → ใช้ `next/image`
- ห้าม commit ไฟล์ PDF ขนาดใหญ่เข้า git โดยไม่จำเป็น (พิจารณา storage แยก)
- ห้ามข้าม `next build` ก่อน deploy

---

## 7. คำสั่งที่ใช้บ่อย
```bash
npm run dev          # dev server
npm run build:data   # แปลง xlsx → JSON (scripts/build-data.ts)
npm run build        # production build (ต้องผ่านก่อน deploy)
npm run test         # เทส
```

---

## 8. หมายเหตุสำหรับ AI
- ตอบ/คอมเมนต์เป็น **ภาษาไทย** (ศัพท์เทคนิคคงภาษาอังกฤษได้)
- เมื่อไม่แน่ใจ requirement ของ TOR → ถามก่อน อย่าเดาโครงสร้างข้อมูล
- ก่อนเขียนโค้ดส่วนใด ให้ระบุว่ากำลังอิง skill ตัวไหน (เช่น "ตาม nextjs-developer")
- งานข้ามหลายด้าน → โหลดหลาย skill พร้อมกันได้ตามตารางข้อ 3
```

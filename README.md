# ระบบเอกสารจัดซื้อจัดจ้าง (TOR Website)

เว็บไซต์เปิดดูและค้นหาเอกสาร TOR งานจัดซื้อจัดจ้าง จำแนกตามประเภท × ช่วงวงเงินงบประมาณ
สร้างด้วย **Next.js 14 (App Router) + TypeScript + Tailwind CSS**

## เริ่มใช้งาน
```bash
npm install
npm run build:data   # แปลง Excel → data/*.json (ต้องมี python3 + openpyxl)
npm run dev          # http://localhost:3000
```

## คำสั่ง
| คำสั่ง | หน้าที่ |
|--------|---------|
| `npm run dev` | dev server |
| `npm run build:data` | แปลง `โครงสร้างโฟลเดอร์_รวม_TOR.xlsx` → `data/projects.json`, `data/overview.json` |
| `npm run build` | production build (static export ทุกหน้า) |
| `npm run start` | รัน production server |

## โครงสร้าง
```
data/                 ข้อมูล JSON (สร้างจาก Excel)
public/docs/<code>/   วางไฟล์ PDF ของแต่ละโครงการที่นี่
scripts/build-data.py สคริปต์แปลงข้อมูล
src/
  app/                หน้าเว็บ (App Router)
    page.tsx            Dashboard ภาพรวม
    type/[type]/        รายการตามประเภท (buy/rent/construction/service)
    project/[code]/     รายละเอียดโครงการ + ไฟล์
    search/             ค้นหา (client-side)
  components/          UI components
  lib/                data loaders, constants, utils
  types/              TypeScript types
```

## ไฟล์เอกสาร PDF
ตอนนี้ระบบลิงก์ไปที่ `public/docs/<รหัสโครงการ>/<ชื่อไฟล์>` — นำไฟล์ PDF จริงมาวางตามรหัสโครงการ
หรือปรับ `fileUrl()` ใน [src/lib/utils.ts](src/lib/utils.ts) ให้ชี้ไป object storage ภายนอก

## TOR Health (สถานะการอ่านไฟล์ + OCR)
สถานะมาจากชีต **"เช็คการอ่านไฟล์"** ในไฟล์ Excel — `npm run build:data` อ่านแล้วสร้าง
`data/healthcheck.json` อัตโนมัติ ประกอบด้วย:

- **สถานะการอ่าน** (ระดับไฟล์): `อ่านได้` / `ต้อง OCR` (ภาพสแกน) / `อ่านไม่ได้` (ไฟล์เสีย)
- **ผล OCR** (คอลัมน์ "ผล OCR"): `OCR อ่านได้` / `OCR อ่านไม่ได้` สำหรับไฟล์ที่ต้อง OCR
- **การเข้าถึงข้อความ** = มี text อยู่แล้ว **หรือ** OCR สำเร็จ → สรุปต่อโครงการเป็น
  `เข้าถึงได้ทั้งหมด` / `เข้าถึงได้บางส่วน` / `เข้าถึงไม่ได้`
- สรุประดับระบบ (`fileSummary`): textReady / ocrOk / ocrFail / corrupt / accessible / total

แสดงผลที่: section สรุปบนหน้า `/table`, คอลัมน์ TOR Health ในตาราง, และหน้ารายละเอียดโครงการ
(สถานะรวม + ผล OCR รายไฟล์)

> อัปเดตผล: แก้ชีต "เช็คการอ่านไฟล์" ใน Excel แล้วรัน `npm run build:data` → `npm run build`

## ข้อมูล
- 139 โครงการ · 4 ประเภท (ซื้อ/เช่า/จ้างก่อสร้าง/จ้างเหมาบริการ) · 4 ช่วงวงเงิน
- แก้ข้อมูลที่ไฟล์ Excel ต้นทางแล้วรัน `npm run build:data` ใหม่

> รายละเอียดสถาปัตยกรรม + การ route ไปยัง skills ดูที่ [CLAUDE.md](CLAUDE.md)

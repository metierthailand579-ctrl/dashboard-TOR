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

## TOR Health (สถานะการอ่านไฟล์)
สถานะการอ่านไฟล์ TOR มาจากชีต **"เช็คการอ่านไฟล์"** ในไฟล์ Excel (สแกนไว้ล่วงหน้า) — `npm run build:data`
จะอ่านชีตนี้แล้วสร้าง `data/healthcheck.json` โดยอัตโนมัติ มี 3 สถานะระดับไฟล์:
`อ่านได้` / `ต้อง OCR` (เป็นภาพสแกน) / `อ่านไม่ได้` (ไฟล์เสีย) และสรุปเป็นสถานะระดับโครงการ
(`อ่านได้` / `อ่านได้บางส่วน` / `ต้อง OCR` / `อ่านไม่ได้` / `ไม่มีข้อมูล`)

> อัปเดตผลการอ่าน: แก้ชีต "เช็คการอ่านไฟล์" ในไฟล์ Excel แล้วรัน `npm run build:data` ใหม่

## ข้อมูล
- 139 โครงการ · 4 ประเภท (ซื้อ/เช่า/จ้างก่อสร้าง/จ้างเหมาบริการ) · 4 ช่วงวงเงิน
- แก้ข้อมูลที่ไฟล์ Excel ต้นทางแล้วรัน `npm run build:data` ใหม่

> รายละเอียดสถาปัตยกรรม + การ route ไปยัง skills ดูที่ [CLAUDE.md](CLAUDE.md)

import type { MetadataRoute } from "next";

/**
 * /robots.txt — ห้าม search engine ทุกตัว crawl/index เว็บนี้
 * (ตั้งใจให้เข้าถึงได้เฉพาะผู้มีลิงก์ ไม่ต้องการให้ค้นเจอใน Google ฯลฯ)
 * คู่กับ metadata.robots ใน layout.tsx (noindex ราย HTML)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}

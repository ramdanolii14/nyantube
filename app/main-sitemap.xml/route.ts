// app/main-sitemap.xml/route.ts
import { NextResponse } from "next/server";

export const revalidate = 60 * 60;

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nyantube.ramdan.fun";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml; charset=UTF-8" },
  });
}

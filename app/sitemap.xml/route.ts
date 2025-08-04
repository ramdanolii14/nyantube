import { supabase } from "@/supabase/client";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nyantube.ramdan.fun";

  // Halaman statis
  const staticPages = [
    "",
    "about",
    "contact",
    "terms",
  ];

  // Sitemap index
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${staticPages
    .map(
      (page) => `
    <sitemap>
      <loc>${baseUrl}/${page}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
    </sitemap>`
    )
    .join("")}
  <sitemap>
    <loc>${baseUrl}/video-sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
  <sitemap>
    <loc>${baseUrl}/channel-sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
</sitemapindex>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

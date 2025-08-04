import { supabase } from "@/supabase/client";

export async function GET() {
  const { data: videos } = await supabase.from("videos").select("id, created_at");
  const { data: profiles } = await supabase.from("profiles").select("username");

  const baseUrl = "https://nyantube.ramdan.fun";

  let urls = "";

  videos?.forEach((v) => {
    urls += `
      <url>
        <loc>${baseUrl}/watch/${v.id}</loc>
        <lastmod>${new Date(v.created_at).toISOString()}</lastmod>
        <priority>0.8</priority>
      </url>
    `;
  });

  profiles?.forEach((p) => {
    urls += `
      <url>
        <loc>${baseUrl}/${p.username}</loc>
        <priority>0.6</priority>
      </url>
    `;
  });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls}
    </urlset>`,
    {
      headers: { "Content-Type": "application/xml" },
    }
  );
}

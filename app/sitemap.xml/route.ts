import { supabase } from "@/supabase/client"; // Supabase server client

export async function GET() {
  const baseUrl = "https://nyantube.ramdan.fun";

  // Ambil semua video
  const { data: videos, error: videoError } = await supabase
    .from("videos")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  if (videoError) {
    console.error(videoError);
  }

  // Ambil semua user (channel)
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("username, updated_at");

  if (profileError) {
    console.error(profileError);
  }

  // Buat daftar URL statis
  const staticUrls = [
    { loc: `${baseUrl}/`, priority: "1.0" },
    { loc: `${baseUrl}/about`, priority: "0.5" },
    { loc: `${baseUrl}/contact`, priority: "0.5" },
    { loc: `${baseUrl}/terms`, priority: "0.5" },
  ];

  let urls = "";

  // Tambahkan halaman statis
  staticUrls.forEach((page) => {
    urls += `
      <url>
        <loc>${page.loc}</loc>
        <priority>${page.priority}</priority>
      </url>
    `;
  });

  // Tambahkan semua video
  videos?.forEach((v) => {
    urls += `
      <url>
        <loc>${baseUrl}/watch/${v.id}</loc>
        <lastmod>${new Date(v.created_at).toISOString()}</lastmod>
        <priority>0.8</priority>
      </url>
    `;
  });

  // Tambahkan semua channel
  profiles?.forEach((p) => {
    urls += `
      <url>
        <loc>${baseUrl}/${p.username}</loc>
        <lastmod>${p.updated_at ? new Date(p.updated_at).toISOString() : new Date().toISOString()}</lastmod>
        <priority>0.6</priority>
      </url>
    `;
  });

  // Return XML response
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

// app/sitemap.xml/route.ts
import { supabase } from "@/supabase/client";
import { NextResponse } from "next/server";

export const revalidate = 60 * 60; // update tiap 1 jam

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nyantube.ramdan.fun";

  // Halaman statis
  const staticPages = ["", "about", "contact", "terms"].map((page) => ({
    loc: `${baseUrl}/${page}`,
    lastmod: new Date().toISOString(),
  }));

  // Ambil semua video
  const { data: videos, error: videoError } = await supabase
    .from("videos")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  // Ambil semua channel
  const { data: channels, error: channelError } = await supabase
    .from("profiles")
    .select("username, updated_at")
    .order("updated_at", { ascending: false });

  if (videoError || channelError) {
    console.error("Sitemap error:", videoError || channelError);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }

  // Convert ke format URL
  const videoUrls =
    videos?.map((video) => ({
      loc: `${baseUrl}/watch/${video.id}`,
      lastmod: new Date(video.created_at).toISOString(),
    })) || [];

  const channelUrls =
    channels?.map((ch) => ({
      loc: `${baseUrl}/${ch.username}`,
      lastmod: new Date(ch.updated_at || new Date()).toISOString(),
    })) || [];

  // Gabungkan semua URL
  const allUrls = [...staticPages, ...videoUrls, ...channelUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls
  .map(
    (url) => `
  <url>
    <loc>${url.loc}</loc>
    <lastmod>${url.lastmod}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

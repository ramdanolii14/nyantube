// app/sitemap.xml/route.ts
import { supabase } from "@/supabase/client";
import { NextResponse } from "next/server";

export const revalidate = 60 * 60; // update tiap 1 jam

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nyantube.ramdan.fun";

  // Halaman statis
  const staticPages = ["", "about", "contact", "terms"].map((page) => ({
    xml: `
    <url>
      <loc>${baseUrl}/${page}</loc>
      <lastmod>${new Date().toISOString()}</lastmod>
      <changefreq>daily</changefreq>
      <priority>0.8</priority>
    </url>`,
  }));

  // Ambil video
  const { data: videos, error: videoError } = await supabase
    .from("videos")
    .select("id, title, created_at, thumbnail_url, profiles(username)")
    .order("created_at", { ascending: false });

  // Ambil channel
  const { data: channels, error: channelError } = await supabase
    .from("profiles")
    .select("username")
    .order("username", { ascending: true });

  if (videoError) {
    console.error("Video sitemap error:", videoError);
  }
  if (channelError) {
    console.error("Channel sitemap error:", channelError);
  }

  // Video URLs
  const videoUrls =
    videos?.map((video) => {
      const username =
        Array.isArray(video.profiles) && video.profiles.length > 0
          ? video.profiles[0].username
          : "Unknown";

      const thumbUrl = video.thumbnail_url
        ? `${baseUrl}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`
        : `${baseUrl}/default-thumbnail.jpg`;

      return {
        xml: `
        <url>
          <loc>${baseUrl}/watch/${video.id}</loc>
          <lastmod>${new Date(video.created_at || new Date()).toISOString()}</lastmod>
          <changefreq>daily</changefreq>
          <priority>0.9</priority>
          <video:video>
            <video:thumbnail_loc>${thumbUrl}</video:thumbnail_loc>
            <video:title><![CDATA[${video.title || "Untitled"}]]></video:title>
            <video:description><![CDATA[${video.title || "No description"}]]></video:description>
            <video:publication_date>${new Date(video.created_at || new Date()).toISOString()}</video:publication_date>
            <video:uploader>${username}</video:uploader>
            <video:player_loc allow_embed="yes" autoplay="ap=1">${baseUrl}/watch/${video.id}</video:player_loc>
          </video:video>
        </url>`,
      };
    }) || [];

  // Channel URLs
  const channelUrls =
    channels?.map((ch) => ({
      xml: `
      <url>
        <loc>${baseUrl}/${ch.username}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.7</priority>
      </url>`,
    })) || [];

  // Gabung semua
  const allUrls = [...staticPages, ...videoUrls, ...channelUrls];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${allUrls.map((u) => u.xml).join("")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

import { supabase } from "@/supabase/client";
import { NextResponse } from "next/server";

export const revalidate = 60 * 60; // update tiap 1 jam

interface VideoRow {
  id: string;
  title: string;
  created_at: string;
  thumbnail_url: string;
  profiles: {
    username: string;
  };
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nyantube.ramdan.fun";

  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, title, created_at, thumbnail_url, profiles(username)")
    .order("created_at", { ascending: false });

  if (error || !videos) {
    console.error("Error fetching videos for sitemap:", error);
    return new NextResponse("Error generating sitemap", { status: 500 });
  }

  const videoEntries = (videos as VideoRow[])
    .map(
      (video) => `
      <url>
        <loc>${baseUrl}/watch/${video.id}</loc>
        <video:video>
          <video:thumbnail_loc>${baseUrl}/storage/v1/object/public/thumbnails/${video.thumbnail_url}</video:thumbnail_loc>
          <video:title><![CDATA[${video.title}]]></video:title>
          <video:description><![CDATA[${video.title}]]></video:description>
          <video:publication_date>${new Date(video.created_at).toISOString()}</video:publication_date>
          <video:uploader>${video.profiles.username || "Unknown"}</video:uploader>
          <video:player_loc allow_embed="yes" autoplay="ap=1">${baseUrl}/watch/${video.id}</video:player_loc>
        </video:video>
      </url>`
    )
    .join("");

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${videoEntries}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}

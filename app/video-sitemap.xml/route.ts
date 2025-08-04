import { supabase } from "@/supabase/client"; // Supabase server client

export async function GET() {
  const baseUrl = "https://nyantube.ramdan.fun";

  // Ambil semua video terbaru
  const { data: videos, error } = await supabase
    .from("videos")
    .select("id, title, description, thumbnail_url, created_at, profiles(username)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
  }

  let urls = "";

  videos?.forEach((video) => {
    urls += `
      <url>
        <loc>${baseUrl}/watch/${video.id}</loc>
        <video:video>
          <video:thumbnail_loc>${baseUrl}/storage/v1/object/public/thumbnails/${video.thumbnail_url}</video:thumbnail_loc>
          <video:title><![CDATA[${video.title}]]></video:title>
          <video:description><![CDATA[${video.description || "Video diunggah di Nyantube"}]]></video:description>
          <video:publication_date>${new Date(video.created_at).toISOString()}</video:publication_date>
          <video:player_loc allow_embed="yes" autoplay="ap=1">${baseUrl}/watch/${video.id}</video:player_loc>
          <video:uploader>${video.profiles?.username || "Unknown"}</video:uploader>
        </video:video>
      </url>
    `;
  });

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
            xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
      ${urls}
    </urlset>`,
    {
      headers: { "Content-Type": "application/xml" },
    }
  );
}

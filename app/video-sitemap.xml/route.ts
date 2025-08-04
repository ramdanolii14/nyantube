import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://nyantube.ramdan.fun";

  const { data: videos } = await supabase
    .from("videos")
    .select("id, title, created_at, thumbnail_url, profiles(username)")
    .order("created_at", { ascending: false });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
  ${
    videos?.map(video => `
    <url>
      <loc>${baseUrl}/watch/${video.id}</loc>
      <video:video>
        <video:thumbnail_loc>${baseUrl}/storage/v1/object/public/thumbnails/${video.thumbnail_url}</video:thumbnail_loc>
        <video:title><![CDATA[${video.title}]]></video:title>
        <video:description><![CDATA[${video.title}]]></video:description>
        <video:publication_date>${new Date(video.created_at).toISOString()}</video:publication_date>
        <video:uploader>${video.profiles?.username || "Unknown"}</video:uploader>
        <video:player_loc allow_embed="yes" autoplay="ap=1">${baseUrl}/watch/${video.id}</video:player_loc>
      </video:video>
    </url>`).join("") || ""
  }
</urlset>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}

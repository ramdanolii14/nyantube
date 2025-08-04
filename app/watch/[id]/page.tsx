import { supabase } from "@/supabase/client";
import WatchPageClient from "./WatchPageClient";
import { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: video } = await supabase
    .from("videos")
    .select("title, description, thumbnail_url, views, created_at")
    .eq("id", params.id)
    .single();

  if (!video) {
    return {
      title: "Video Not Found | Nyantube",
      description: "The requested video could not be found.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  // Pastikan gambar besar
  const largeThumbnail =
    video.thumbnail_url
      ? `${supabaseUrl}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`
      : `${siteUrl}/default-thumbnail-large.jpg`;

  const desc = `${video.description?.slice(0, 150) || ""} • ${video.views} views • ${new Date(video.created_at).toLocaleDateString()}`;

  return {
    title: `${video.title} | Nyantube`,
    description: desc,
    openGraph: {
      title: video.title,
      description: desc,
      images: [
        {
          url: largeThumbnail,
          width: 1200,
          height: 630,
        },
      ],
      type: "video.other",
      url: `${siteUrl}/watch/${params.id}`,
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description: desc,
      images: [largeThumbnail],
    },
  };
}

export default function Page({ params }: Props) {
  return <WatchPageClient videoId={params.id} />;
}

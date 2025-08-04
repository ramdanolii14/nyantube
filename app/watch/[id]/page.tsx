import { supabase } from "@/supabase/client";
import WatchPageClient from "./WatchPageClient";
import { Metadata } from "next";

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: video } = await supabase
    .from("videos")
    .select("*, profiles(id, username, channel_name)")
    .eq("id", params.id)
    .single();

  if (!video) {
    return {
      title: "Video not found | Nyantube",
      description: "The requested video could not be found.",
    };
  }

  const viewsText = `${video.views || 0} views`;
  const dateText = new Date(video.created_at).toLocaleDateString();
  const shortDesc = video.description?.slice(0, 120) || "";
  const description = `${viewsText} • Uploaded on ${dateText}${shortDesc ? " — " + shortDesc : ""}`;

  const title = `${video.title} | Nyantube`;
  const thumbnailUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`;
  const canonicalUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/watch/${params.id}`;

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: "video.other",
      images: [
        {
          url: thumbnailUrl,
          width: 1200,
          height: 630,
          alt: video.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [thumbnailUrl],
    },
    other: {
      "script:ld+json": JSON.stringify({
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: video.title,
        description,
        thumbnailUrl: [thumbnailUrl],
        uploadDate: video.created_at,
        contentUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`,
        embedUrl: canonicalUrl,
        interactionStatistic: {
          "@type": "InteractionCounter",
          interactionType: { "@type": "WatchAction" },
          userInteractionCount: video.views || 0,
        },
      }),
    },
  };
}

export default function WatchPage({ params }: Props) {
  return <WatchPageClient id={params.id} />;
}

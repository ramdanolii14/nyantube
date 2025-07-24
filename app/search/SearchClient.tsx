"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/supabase/client";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    async function fetchVideos() {
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, video_url")
        .ilike("title", `%${query}%`);

      if (error) console.error(error);
      setVideos(data || []);
      setLoading(false);
    }

    fetchVideos();
  }, [query]);

  if (loading) return <p className="p-4 text-center">Loading...</p>;

  if (videos.length === 0)
    return <p className="p-4 text-center">No videos found.</p>;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
      {videos.map((v) => (
        <div key={v.id} className="border rounded-md overflow-hidden">
          <video
            className="w-full h-40 object-cover"
            src={
              v.thumbnail_url
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`
                : v.video_url // fallback ambil detik pertama video
            }
            muted
            playsInline
            preload="metadata"
            onLoadedMetadata={(e) => {
              const videoEl = e.currentTarget;
              videoEl.currentTime = 1;
            }}
          />
          <div className="p-2 text-sm font-medium">{v.title}</div>
        </div>
      ))}
    </div>
  );
}

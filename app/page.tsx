"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import VideoList, { Video } from "@/app/components/VideoList";

export default function Page() {
  const [videos, setVideos] = useState<Video[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select(
          "id, user_id, title, description, video_url, thumbnail_url, views, created_at, is_public, likes, dislikes"
        )
        .eq("is_public", true)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("FETCH ERROR:", error);
        return;
      }

      const formatted = (data || []).map((v: any) => ({
        id: v.id,
        user_id: v.user_id,
        title: v.title,
        description: v.description,
        video_url: supabase.storage
          .from("videos")
          .getPublicUrl(v.video_url).data.publicUrl,
        thumbnail_url: supabase.storage
          .from("thumbnails")
          .getPublicUrl(v.thumbnail_url).data.publicUrl,
        views: v.views,
        created_at: v.created_at,
        is_public: v.is_public,
        likes: v.likes,
        dislikes: v.dislikes,
      }));

      setVideos(formatted as Video[]);
    };

    fetchVideos();
  }, [supabase]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Nyantube</h1>
      <VideoList videos={videos} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import VideoList, { Video } from "@/app/components/VideoList";

export default function Page() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          id, user_id, title, description, video_url, thumbnail_url, views, created_at, is_public, likes, dislikes,
          profiles(username, channel_name, avatar_url)
        `)
        .eq("is_public", true)
        // 🔥 Algoritma tetap (views + likes - dislikes)
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
        video_url: v.video_url, // biar VideoList yang handle public URL
        thumbnail_url: v.thumbnail_url,
        views: v.views,
        created_at: v.created_at,
        is_public: v.is_public,
        likes: v.likes,
        dislikes: v.dislikes,
        profiles: v.profiles,
      }));

      // 🔥 Urutkan berdasarkan algoritma (bukan cuma created_at)
      const sorted = formatted.sort(
        (a, b) =>
          b.views + (b.likes - b.dislikes) * 2 -
          (a.views + (a.likes - a.dislikes) * 2)
      );

      setVideos(sorted as Video[]);
    };

    fetchVideos();
  }, []);

  return (
    <div className="p-4 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nyantube</h1>
      <VideoList videos={videos} />
    </div>
  );
}

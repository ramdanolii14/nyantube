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
        .select("id, title, url, thumbnail, user_id, profiles(username, avatar_url)");

      if (error) {
        console.error(error);
      } else {
        const formatted = (data || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          url: v.url,
          thumbnail_url: v.thumbnail, // ✅ sesuaikan dengan type Video
          user_id: v.user_id,
          profile: {
            username: v.profiles?.[0]?.username || "",
            avatar_url: v.profiles?.[0]?.avatar_url || "",
          },
        })) as Video[];

        setVideos(formatted);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Nyantube</h1>
      <VideoList videos={videos} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import VideoList, { Video } from "@/app/components/VideoList";

export default function Page() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, url, thumbnail, user_id, profiles(username, avatar_url)");

      if (!error && data) {
        setVideos(
          data.map((v: any) => ({
            id: v.id,
            title: v.title,
            url: v.url,
            thumbnail: v.thumbnail,
            user_id: v.user_id ?? "", // ✅ fallback biar nggak undefined
            profile: v.profiles
              ? {
                  username: v.profiles.username,
                  avatar_url: v.profiles.avatar_url,
                }
              : undefined,
          }))
        );
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

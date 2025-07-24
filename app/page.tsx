"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import VideoList, { Video as VideoType } from "@/app/components/VideoList";

export default function Page() {
  const [videos, setVideos] = useState<VideoType[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, user_id, profile");

      if (!error && data) {
        setVideos(data as VideoType[]);
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

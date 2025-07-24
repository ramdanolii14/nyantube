"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import VideoList from "@/app/components/VideoList";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  created_at: string;
  user_id?: string; // biar sama kayak VideoList
  profile?: any;
}

export default function Page() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setVideos(data);
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

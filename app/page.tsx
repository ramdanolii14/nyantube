"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import VideoList from "@/app/components/VideoList";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  user_id: string;
  profile: {
    username: string;
  };
}

export default function Page() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          thumbnail_url,
          user_id,
          profile:profiles(username)
        `);

      if (!error && data) {
        // ✅ Convert array profile[] -> object profile
        const formattedData: Video[] = data.map((video: any) => ({
          id: video.id,
          title: video.title,
          thumbnail_url: video.thumbnail_url,
          user_id: video.user_id,
          profile: {
            username: video.profile?.[0]?.username || "Unknown",
          },
        }));

        setVideos(formattedData);
      }

      setLoading(false);
    };

    fetchVideos();
  }, []);

  if (loading) return <p className="text-center mt-10">Loading Video...</p>;

  return (
    <main className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-6">
        <VideoList videos={videos} />
      </div>
    </main>
  );
}

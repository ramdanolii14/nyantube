"use client";

import Navbar from "@/app/components/Navbar";
import VideoList from "@/app/components/VideoList";
import { useEffect, useState } from "react";
import { createClient } from "@/supabase/client";

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
        .select("id, title, thumbnail_url, user_id, profile(username)");

      if (!error && data) {
        setVideos(data as Video[]);
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <main className="bg-gray-100 min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading videos...</p>
      </main>
    );
  }

  return (
    <main className="bg-gray-100 min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-6">
        <VideoList videos={videos} />
      </div>
    </main>
  );
}

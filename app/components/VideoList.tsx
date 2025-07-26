"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  user_id: string;
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log("🔄 Fetching videos...");
        const { data, error } = await supabase
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        console.log("✅ Videos fetched:", data);
        setVideos(data || []);
      } catch (err) {
        console.error("❌ Error fetching videos:", err);
      }
    };

    fetchVideos();
  }, []);

  if (videos.length === 0) {
    return <div className="text-center mt-8 text-gray-500">No videos found.</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
      {videos.map((v) => (
        <Link key={v.id} href={`/watch/${v.id}`}>
          <div className="bg-white rounded shadow hover:shadow-lg transition">
            <img
              src={
                v.thumbnail_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`
                  : "/default-thumbnail.png"
              }
              alt={v.title}
              className="rounded-t w-full h-40 object-cover"
            />
            <div className="p-2">
              <h2 className="font-semibold line-clamp-2">{v.title}</h2>
              <p className="text-sm text-gray-500 mt-1">Views {v.views}</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

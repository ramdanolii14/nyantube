"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client"; // sesuaikan path supabase-mu
import Image from "next/image";
import Link from "next/link";

interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  views: number;
  created_at: string;
  is_public: boolean;
  likes: number;
  dislikes: number;
  thumbnail_url: string;
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("is_public", true) // hanya ambil video publik
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching videos:", error.message);
      } else if (data) {
        setVideos(data as Video[]);
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading videos...</p>;
  }

  if (videos.length === 0) {
    return <p className="text-center text-gray-500">No videos found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition"
        >
          <Link href={`/watch/${video.id}`}>
            <div className="relative w-full h-48">
              <Image
                src={video.thumbnail_url || "/default-thumbnail.jpg"}
                alt={video.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="p-2">
              <h3 className="text-sm font-semibold line-clamp-2">{video.title}</h3>
              <p className="text-xs text-gray-500 mt-1">
                {video.views} views • {new Date(video.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}

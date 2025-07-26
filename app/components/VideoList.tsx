"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
  profiles?: {
    channel_name: string;
    avatar_url: string | null;
  };
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*, profiles(channel_name, avatar_url)")
        .order("views", { ascending: false }) // ✅ Prioritas views
        .order("likes", { ascending: false }) // ✅ Kalau views sama, likes lebih tinggi di atas
        .order("created_at", { ascending: false }); // ✅ Terbaru di atas

      if (data) {
        setVideos(
          data.map((v: any) => ({
            ...v,
            profiles: v.profiles || {
              channel_name: "Unknown",
              avatar_url: null,
            },
          })) as Video[]
        );
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="bg-white rounded-lg shadow hover:shadow-lg transition p-2"
        >
          <div className="relative w-full rounded-md overflow-hidden" style={{ paddingTop: "56.25%" }}>
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
              alt={video.title}
              fill
              className="absolute top-0 left-0 w-full h-full object-cover"
              unoptimized
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <Image
              src={
                video.profiles?.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${video.profiles?.channel_name}`
              }
              alt={video.profiles?.channel_name || "Unknown"}
              width={40}
              height={40}
              className="rounded-full object-cover aspect-square"
              unoptimized
            />
            <div>
              <h3 className="font-semibold text-sm line-clamp-2">{video.title}</h3>
              <p className="text-xs text-gray-600">{video.profiles?.channel_name}</p>
              <p className="text-xs text-gray-500">{video.views} views</p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

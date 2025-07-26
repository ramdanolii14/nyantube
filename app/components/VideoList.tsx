"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Link from "next/link";
import Image from "next/image";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
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
        .select("id, title, thumbnail_url, created_at, profiles(channel_name, avatar_url)")
        .order("created_at", { ascending: false });

      if (data) {
        setVideos(
          data.map((v: any) => ({
            ...v,
            profiles: v.profiles || { channel_name: "Unknown Channel", avatar_url: null },
          }))
        );
      }
    };

    fetchVideos();
  }, []);

  if (!videos.length) {
    return <p className="text-center mt-10">Belum ada video yang diunggah.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="bg-white rounded-lg shadow hover:shadow-lg transition p-2"
        >
          <div className="relative w-full h-40 bg-gray-200 rounded overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
              alt={video.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <h2 className="font-semibold mt-2 text-sm">{video.title}</h2>
          <p className="text-xs text-gray-500">
            {video.profiles?.channel_name || "Unknown Channel"} •{" "}
            {new Date(video.created_at).toLocaleDateString()}
          </p>
        </Link>
      ))}
    </div>
  );
}

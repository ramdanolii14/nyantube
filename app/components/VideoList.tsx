"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/supabase/client";

export interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*, profiles(username, avatar_url)")
        .order("created_at", { ascending: false });
      if (data) {
        setVideos(
          data.map((v: any) => ({
            ...v,
            profiles: v.profiles || { username: "Unknown", avatar_url: null },
          })) as Video[]
        );
      }
    };
    fetchVideos();
  }, []);

  if (!videos.length) return <p className="text-center mt-10">Loading videos...</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="block bg-white rounded shadow hover:shadow-md"
        >
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
            alt={video.title}
            width={400}
            height={250}
            className="rounded-t w-full h-48 object-cover"
            unoptimized
          />
          <div className="p-3">
            <h3 className="font-semibold text-sm truncate">{video.title}</h3>
            <p className="text-xs text-gray-500">
              {video.profiles?.username || "Unknown"}
            </p>
            <p className="text-xs text-gray-400">
              {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

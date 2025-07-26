"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/supabase/client";

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  profiles: {
    channel_name: string;
    avatar_url: string | null;
  };
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log("🔄 Fetching videos...");
        const { data, error } = await supabase
          .from("videos")
          .select(
            `
            id,
            title,
            video_url,
            thumbnail_url,
            views,
            profiles!videos_user_id_fkey (
              channel_name,
              avatar_url
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        console.log("✅ Videos fetched:", data);

        setVideos(data || []);
      } catch (err) {
        console.error("❌ Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) return <p className="text-center mt-8">Loading videos...</p>;

  if (!videos.length)
    return (
      <p className="text-center mt-8 text-red-500">
        ❌ No videos found (check Supabase).
      </p>
    );

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {videos.map((v) => (
        <Link
          key={v.id}
          href={`/watch/${v.id}`}
          className="border rounded-md bg-white shadow hover:shadow-lg transition p-2"
        >
          <div className="relative w-full h-48 bg-gray-200 rounded overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
              alt={v.title}
              fill
              className="object-cover"
            />
          </div>
          <p className="font-semibold mt-2 text-sm line-clamp-2">{v.title}</p>
          <p className="text-xs text-gray-500">{v.views} views</p>
          <div className="flex items-center gap-2 mt-1">
            <Image
              src={
                v.profiles?.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${v.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${
                      v.profiles?.channel_name || "Unknown"
                    }`
              }
              alt={v.profiles?.channel_name || "Unknown"}
              width={24}
              height={24}
              className="rounded-full"
            />
            <p className="text-xs text-gray-600">
              {v.profiles?.channel_name || "Unknown"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

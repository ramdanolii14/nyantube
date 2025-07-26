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
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
    channel_name?: string;
  };
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log("🔄 Fetching all videos...");
        const { data, error } = await supabase
          .from("videos")
          .select(
            `
            id,
            title,
            thumbnail_url,
            views,
            created_at,
            profiles (
              username,
              avatar_url,
              channel_name
            )
          `
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        console.log("✅ Videos data:", data);

        setVideos(
          (data || []).map((v: any) => ({
            ...v,
            profiles: v.profiles
              ? Array.isArray(v.profiles)
                ? v.profiles[0]
                : v.profiles
              : {
                  username: "Unknown",
                  avatar_url: null,
                  channel_name: "Unknown",
                },
          }))
        );
      } catch (error) {
        console.error("❌ Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <p className="text-center mt-8">Loading videos...</p>;
  }

  if (videos.length === 0) {
    return (
      <p className="text-center mt-8 text-gray-500">
        No videos uploaded yet.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="bg-white rounded-md shadow hover:shadow-lg transition p-2"
        >
          <div className="relative w-full aspect-video bg-gray-200 rounded overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
              alt={video.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Image
              src={
                video.profiles?.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${
                      video.profiles?.username || "Unknown"
                    }`
              }
              alt={video.profiles?.username || "Unknown"}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <p className="font-semibold text-sm line-clamp-2">{video.title}</p>
              <p className="text-xs text-gray-500">
                {video.views} views •{" "}
                {new Date(video.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

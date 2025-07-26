"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  username: string;
  avatar_url: string | null;
  channel_name?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  profiles: Profile;
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const { data, error } = await supabase
          .from("videos")
          .select(`
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
          `)
          .order("created_at", { ascending: false });

        if (error) throw error;

        console.log("✅ Videos data:", data); // 🔥 Debug

        const mapped = (data || []).map((v: any) => ({
          ...v,
          profiles: v.profiles
            ? {
                username: v.profiles.username || "Unknown",
                avatar_url: v.profiles.avatar_url || null,
                channel_name: v.profiles.channel_name || "",
              }
            : {
                username: "Unknown",
                avatar_url: null,
                channel_name: "",
              },
        }));

        setVideos(mapped);
      } catch (err) {
        console.error("❌ Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) return <p className="text-center mt-6">Loading videos...</p>;

  if (videos.length === 0)
    return <p className="text-center mt-6 text-gray-500">No videos found.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="bg-white rounded shadow hover:shadow-md transition p-2"
        >
          <div className="relative w-full h-40 bg-gray-200 rounded overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
              alt={video.title}
              fill
              className="object-cover"
            />
          </div>
          <h3 className="mt-2 font-semibold text-sm line-clamp-2">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500">{video.views} views</p>
          <div className="flex items-center gap-2 mt-1">
            <Image
              src={
                video.profiles.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${video.profiles.username}`
              }
              alt={video.profiles.username}
              width={24}
              height={24}
              className="rounded-full"
            />
            <p className="text-xs text-gray-700">
              {video.profiles.channel_name || video.profiles.username}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}

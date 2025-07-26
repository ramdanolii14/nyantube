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

        // ✅ Pastikan profiles bukan array
        const mappedData = (data || []).map((v: any) => ({
          ...v,
          profiles: v.profiles
            ? {
                username: v.profiles.username || "Unknown",
                avatar_url: v.profiles.avatar_url || null,
                channel_name: v.profiles.channel_name || "Unknown",
              }
            : {
                username: "Unknown",
                avatar_url: null,
                channel_name: "Unknown",
              },
        }));

        setVideos(mappedData);
      } catch (err) {
        console.error("❌ Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <p className="text-center mt-6">Loading videos...</p>;
  }

  if (videos.length === 0) {
    return <p className="text-center mt-6 text-gray-500">No videos found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {videos.map((v) => (
        <Link
          key={v.id}
          href={`/watch/${v.id}`}
          className="bg-white rounded-lg shadow hover:shadow-md transition p-2"
        >
          <div className="relative w-full aspect-video bg-gray-200 rounded-md overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
              alt={v.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <Image
              src={
                v.profiles.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${v.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${v.profiles.username}`
              }
              alt={v.profiles.username}
              width={36}
              height={36}
              className="rounded-full"
            />
            <div>
              <p className="text-sm font-semibold line-clamp-2">{v.title}</p>
              <p className="text-xs text-gray-500">{v.profiles.username}</p>
              <p className="text-xs text-gray-500">
                {v.views} views • {new Date(v.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

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
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        // ✅ FIX: Pastikan profiles bukan array
        const mapped = (data || []).map((v: any) => ({
          ...v,
          profiles: Array.isArray(v.profiles)
            ? v.profiles[0]
            : v.profiles,
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

  if (loading) {
    return <p className="text-center mt-8">Loading videos...</p>;
  }

  if (!videos.length) {
    return <p className="text-center mt-8 text-gray-500">No videos found.</p>;
  }

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="bg-white rounded-lg shadow hover:shadow-md transition p-2"
        >
          <div className="relative w-full h-40 bg-gray-200 rounded overflow-hidden">
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
                  : `https://ui-avatars.com/api/?name=${video.profiles?.username}`
              }
              alt={video.profiles?.username}
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <p className="text-sm font-semibold line-clamp-2">
                {video.title}
              </p>
              <p className="text-xs text-gray-500">
                {video.profiles?.username} • {video.views} views
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  id: string;
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
  user_id: string;
  profiles?: Profile;
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log("🔄 Fetching videos...");

        // ✅ Ambil semua video DULU
        const { data: videosData, error: videosError } = await supabase
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false });

        if (videosError) throw videosError;

        console.log("✅ Videos fetched:", videosData);

        // ✅ Ambil data profile untuk setiap video secara manual
        const videosWithProfiles: Video[] = await Promise.all(
          (videosData || []).map(async (video: any) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("id, username, avatar_url, channel_name")
              .eq("id", video.user_id)
              .single();

            return {
              ...video,
              profiles: profileData || {
                id: "",
                username: "Unknown",
                avatar_url: null,
                channel_name: "Unknown",
              },
            };
          })
        );

        setVideos(videosWithProfiles);
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
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="bg-white rounded-md shadow hover:shadow-md transition p-2"
        >
          <div className="relative w-full h-40 bg-gray-200 rounded-md overflow-hidden">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
              alt={video.title}
              fill
              className="object-cover"
            />
          </div>
          <h3 className="text-sm font-semibold mt-2 line-clamp-2">
            {video.title}
          </h3>
          <p className="text-xs text-gray-500">{video.views} views</p>
          <div className="flex items-center gap-2 mt-1">
            <Image
              src={
                video.profiles?.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${video.profiles?.username}`
              }
              alt={video.profiles?.username || "Unknown"}
              width={24}
              height={24}
              className="rounded-full"
            />
            <span className="text-xs text-gray-600">
              {video.profiles?.channel_name || video.profiles?.username}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

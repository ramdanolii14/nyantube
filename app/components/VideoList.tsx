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
  user_id: string;
  profiles: Profile;
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        console.log("🔄 Fetching videos...");

        // ✅ Ambil semua video dulu
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select("*")
          .order("created_at", { ascending: false });

        if (videoError) throw videoError;

        // ✅ Ambil profil masing-masing video (manual join)
        const videosWithProfiles = await Promise.all(
          (videoData || []).map(async (v: any) => {
            const { data: profileData } = await supabase
              .from("profiles")
              .select("username, avatar_url, channel_name")
              .eq("id", v.user_id)
              .single();

            return {
              ...v,
              profiles: profileData || {
                username: "Unknown",
                avatar_url: null,
                channel_name: "Unknown",
              },
            };
          })
        );

        setVideos(videosWithProfiles);
        console.log("✅ Videos loaded:", videosWithProfiles);
      } catch (error) {
        console.error("❌ Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <div className="text-center mt-8">Loading videos...</div>;
  }

  if (!videos.length) {
    return (
      <div className="text-center mt-8 text-gray-500">
        No videos found.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="border rounded-lg overflow-hidden shadow hover:shadow-md transition bg-white"
        >
          <div className="relative w-full h-48 bg-gray-200">
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
              alt={video.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-2 flex gap-2">
            <Image
              src={
                video.profiles.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${video.profiles.username}`
              }
              alt={video.profiles.username}
              width={36}
              height={36}
              className="rounded-full"
            />
            <div className="flex-1">
              <p className="font-semibold line-clamp-2">{video.title}</p>
              <p className="text-xs text-gray-500">{video.profiles.username}</p>
              <p className="text-xs text-gray-400">
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

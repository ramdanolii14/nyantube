"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

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
        console.log("✅ Videos fetched (raw):", data);

        // ✅ Paksa profiles jadi object tunggal
        const mappedData: Video[] = (data || []).map((v: any) => ({
          ...v,
          profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
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

  if (loading) return <p className="text-center mt-4">Loading videos...</p>;
  if (!videos.length) return <p className="text-center mt-4">No videos found.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="block bg-white rounded-lg shadow hover:shadow-md transition"
        >
          <Image
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
            alt={video.title}
            width={400}
            height={225}
            className="rounded-t-lg w-full h-auto"
          />
          <div className="p-2 flex gap-2">
            <Image
              src={
                video.profiles.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${video.profiles.channel_name}`
              }
              alt={video.profiles.channel_name}
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <p className="font-semibold text-sm">{video.title}</p>
              <p className="text-xs text-gray-500">
                {video.profiles.channel_name} • {video.views} views
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

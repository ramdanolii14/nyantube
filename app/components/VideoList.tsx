"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/supabase/client";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  user_id: string;
  profile: {
    username: string;
  };
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetchVideos = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, user_id, profile:profiles(username)");

      if (!error && data) {
        const fixedData = data.map((v: any) => ({
          ...v,
          profile: Array.isArray(v.profile)
            ? v.profile[0] || { username: "Unknown" }
            : v.profile,
        }));
        setVideos(fixedData as Video[]);
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-500">Loading...</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="group block rounded-lg overflow-hidden shadow hover:shadow-md transition"
        >
          <div className="relative w-full h-48 bg-gray-200">
            <Image
              src={video.thumbnail_url}
              alt={video.title}
              width={320}
              height={180}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>

          <div className="p-3">
            <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition">
              {video.title}
            </h3>
            <p className="text-xs text-gray-600 mt-1">@{video.profile.username}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

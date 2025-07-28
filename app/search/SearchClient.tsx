"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { supabase } from "@/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  profiles: {
    channel_name: string;
    avatar_url: string;
  };
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          thumbnail_url,
          views,
          profiles (
            channel_name,
            avatar_url
          )
        `)
        .ilike("title", `%${query}%`);

      if (error) {
        console.error("Supabase fetch error:", error);
        setLoading(false);
        return;
      }

      setVideos(data as Video[]);
      setLoading(false);
    };

    if (query) fetchResults();
  }, [query]);

  return (
    <div className="pt-24 px-4 md:px-12 lg:px-20">
      <h1 className="text-xl font-semibold mb-6">
        Hasil pencarian untuk &quot;{query}&quot;
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : videos.length === 0 ? (
        <p>Tidak ada hasil ditemukan.</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {videos.map((video) => (
            <li key={video.id} className="rounded-lg overflow-hidden bg-white shadow hover:shadow-md transition-all">
              <Link href={`/watch/${video.id}`} className="block">
                <img
                  src={`${SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
                  alt={video.title}
                  className="w-full h-40 object-cover"
                />
                <div className="flex gap-2 p-3">
                  <Image
                    src={
                      video.profiles?.avatar_url
                        ? `${SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                        : "/default-avatar.png"
                    }
                    alt={video.profiles?.channel_name}
                    width={36}
                    height={36}
                    className="rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h2 className="text-sm font-semibold line-clamp-2">{video.title}</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {video.profiles?.channel_name} · {video.views} views
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

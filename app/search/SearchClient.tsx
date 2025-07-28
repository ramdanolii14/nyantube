"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

type Video = {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  profiles: {
    channel_name: string;
  };
};

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;

      setLoading(true);

      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, views, profiles(channel_name)")
        .ilike("title", `%${query}%`);

      if (error) {
        console.error("Fetch error:", error.message);
        setLoading(false);
        return;
      }

      const cleaned: Video[] = (data || []).map((video: any) => ({
        ...video,
        profiles: video.profiles[0], // Ambil satu profile (Supabase return array)
      }));

      setVideos(cleaned);
      setLoading(false);
    };

    fetchResults();
  }, [query]);

  return (
    <div className="p-4 pt-24">
      <h1 className="text-xl font-semibold mb-6 text-center">
        Hasil pencarian untuk: <span className="text-blue-600">"{query}"</span>
      </h1>

      {loading ? (
        <p className="text-center">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="text-center text-gray-500">Tidak ada hasil ditemukan.</p>
      ) : (
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {videos.map((video) => (
            <li
              key={video.id}
              className="border rounded-lg overflow-hidden shadow bg-white hover:shadow-md transition-all"
            >
              <img
                src={`${SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
                alt={video.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-2">
                <h2 className="text-sm font-semibold line-clamp-2">{video.title}</h2>
                <p className="text-xs text-gray-600 mt-1">
                  {video.profiles?.channel_name} · {video.views} views
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

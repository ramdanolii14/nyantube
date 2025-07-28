"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

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
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, views, profiles(channel_name)")
        .ilike("title", `%${query}%`);

      if (error) console.error(error);

      const cleanedData: Video[] = (data || []).map((video: any) => ({
        ...video,
        profiles: video.profiles[0], // ⬅️ ambil hanya satu profile pertama
      }));

      setVideos(cleanedData);
      setLoading(false);
    };

    if (query) fetchResults();
  }, [query]);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">
        Hasil pencarian untuk "{query}"
      </h1>
      {loading ? (
        <p>Loading...</p>
      ) : videos.length === 0 ? (
        <p>Tidak ada hasil ditemukan.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-3">
          {videos.map((video) => (
            <li key={video.id}>
              <img src={video.thumbnail_url} alt={video.title} />
              <h2 className="text-lg font-medium mt-2">{video.title}</h2>
              <p className="text-sm text-gray-600">
                {video.profiles?.channel_name} · {video.views} views
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

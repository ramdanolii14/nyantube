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

const getThumbnailUrl = (path: string) => {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${path}`;
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

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      setVideos(data || []);
      setLoading(false);
    };

    if (query) fetchResults();
  }, [query]);

  return (
    <div className="pt-24 px-4">
      <h1 className="text-xl font-semibold mb-4 text-center">
        Hasil pencarian untuk &quot;{query}&quot;
      </h1>

      {loading ? (
        <p className="text-center mt-20">Loading...</p>
      ) : videos.length === 0 ? (
        <p className="text-center mt-20">Tidak ada hasil ditemukan.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {videos.map((video) => (
            <li
              key={video.id}
              className="border rounded-md overflow-hidden bg-white shadow hover:shadow-md transition"
            >
              <img
                src={
                  video.thumbnail_url
                    ? getThumbnailUrl(video.thumbnail_url)
                    : "/default-thumbnail.jpg"
                }
                alt={video.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-3">
                <h2 className="text-base font-medium line-clamp-2">
                  {video.title}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
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

"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    async function fetchVideos() {
      setLoading(true);
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url")
        .ilike("title", `%${query}%`);

      if (error) console.error(error);
      setVideos(data || []);
      setLoading(false);
    }

    fetchVideos();
  }, [query]);

  if (loading)
    return <p className="p-4 text-center mt-20">Loading...</p>;

  if (videos.length === 0)
    return <p className="p-4 text-center mt-20">No videos found.</p>;

  return (
    <div className="pt-24 px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {videos.map((v) => (
          <Link
            key={v.id}
            href={`/watch/${v.id}`}
            className="border rounded-md overflow-hidden bg-white shadow hover:shadow-lg hover:scale-[1.02] transition-transform"
          >
            <img
              className="w-full h-40 object-cover"
              src={
                v.thumbnail_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`
                  : "/default-thumbnail.jpg" // fallback default
              }
              alt={v.title}
            />
            <div className="p-2 text-sm font-medium line-clamp-2">
              {v.title}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

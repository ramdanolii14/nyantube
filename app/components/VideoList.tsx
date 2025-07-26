"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Link from "next/link";
import Image from "next/image";

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  profiles: {
    channel_name: string;
    avatar_url: string | null;
  } | null;
}

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);
  const [page, setPage] = useState(1);

  const videosPerPage = 30;
  const totalPages = Math.ceil(totalVideos / videosPerPage);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // ✅ Hitung total video
        const { count } = await supabase
          .from("videos")
          .select("*", { count: "exact", head: true });

        if (count) setTotalVideos(count);

        // ✅ Ambil video + data profile (relasi 1:1)
        const from = (page - 1) * videosPerPage;
        const to = from + videosPerPage - 1;

        const { data, error } = await supabase
          .from("videos")
          .select(
            `
              id,
              title,
              video_url,
              thumbnail_url,
              views,
              profiles:profiles!videos_user_id_fkey (
                channel_name,
                avatar_url
              )
            `
          )
          .order("created_at", { ascending: false })
          .range(from, to);

        if (error) throw error;
        setVideos(data || []);
      } catch (err) {
        console.error("❌ Error fetching videos:", err);
      }
    };

    fetchVideos();
  }, [page]);

  return (
    <div className="mt-16 px-4">
      {/* ✅ Video Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {videos.map((v) => (
          <Link key={v.id} href={`/watch/${v.id}`}>
            <div className="bg-white rounded shadow hover:shadow-lg transition">
              <img
                src={
                  v.thumbnail_url
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`
                    : "/default-thumbnail.png"
                }
                alt={v.title}
                className="rounded-t w-full h-40 object-cover"
              />
              <div className="p-2">
                <h2 className="font-semibold line-clamp-2">{v.title}</h2>

                {/* ✅ Avatar + Nama Channel */}
                <div className="flex items-center gap-2 mt-1">
                  <Image
                    src={
                      v.profiles?.avatar_url
                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${v.profiles.avatar_url}`
                        : `https://ui-avatars.com/api/?name=${v.profiles?.channel_name || "Channel"}`
                    }
                    alt={v.profiles?.channel_name || "Channel"}
                    width={22}
                    height={22}
                    className="rounded-full"
                    unoptimized
                  />
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {v.profiles?.channel_name || "Unknown Channel"}
                  </p>
                </div>

                <p className="text-sm text-gray-500 mt-1">Views {v.views}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ✅ Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          <span className="px-3 py-1">
            {page} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

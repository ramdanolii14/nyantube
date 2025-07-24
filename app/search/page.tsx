"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  likes: number;
  views: number;
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const q = searchParams.get("q") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const [videos, setVideos] = useState<Video[]>([]);
  const [totalVideos, setTotalVideos] = useState(0);

  const videosPerPage = 30;
  const totalPages = Math.ceil(totalVideos / videosPerPage);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!q.trim()) return;

      const { count } = await supabase
        .from("videos")
        .select("*", { count: "exact", head: true })
        .ilike("title", `%${q}%`);

      if (count) setTotalVideos(count);

      const from = (page - 1) * videosPerPage;
      const to = from + videosPerPage - 1;

      const { data, error } = await supabase
        .from("videos")
        .select("*")
        .ilike("title", `%${q}%`)
        .order("created_at", { ascending: false })
        .order("likes", { ascending: false })
        .order("views", { ascending: false })
        .range(from, to);

      if (!error) setVideos(data || []);
    };

    fetchSearch();
  }, [q, page]);

  const handlePageChange = (newPage: number) => {
    router.push(`/search?q=${encodeURIComponent(q)}&page=${newPage}`);
  };

  if (!q.trim()) return <p className="mt-20 text-center">Masukkan kata kunci</p>;

  return (
    <div className="max-w-6xl mx-auto mt-20 px-4">
      <h1 className="text-xl font-bold mb-4">
        Hasil pencarian untuk: <span className="text-red-600">{q}</span>
      </h1>

      {videos.length === 0 ? (
        <p className="text-gray-500">Tidak ada video ditemukan.</p>
      ) : (
        <>
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
                    onError={(e) => {
                      if (!v.thumbnail_url) {
                        const video = document.createElement("video");
                        video.src = v.video_url;
                        video.crossOrigin = "anonymous";
                        video.currentTime = 1;

                        video.addEventListener("loadeddata", () => {
                          const canvas = document.createElement("canvas");
                          canvas.width = video.videoWidth;
                          canvas.height = video.videoHeight;
                          const ctx = canvas.getContext("2d");
                          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

                          (e.target as HTMLImageElement).src =
                            canvas.toDataURL("image/png");
                        });
                      }
                    }}
                  />
                  <div className="p-2">
                    <h2 className="font-semibold line-clamp-2">{v.title}</h2>
                    <p className="text-sm text-gray-500">
                      👍 {v.likes} | 👁 {v.views}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Prev
              </button>

              <span className="px-3 py-1">
                {page} / {totalPages}
              </span>

              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
                className="px-3 py-1 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="text-center mt-20">Loading...</p>}>
      <SearchContent />
    </Suspense>
  );
}

"use client";

import Link from "next/link";

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  is_public: boolean;
  likes: number;
  dislikes: number;
}

export default function VideoList({ videos }: { videos: Video[] }) {
  if (!videos.length) return <p>Antara emang sunyi atau database error T-T</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="block border rounded-lg overflow-hidden shadow hover:shadow-lg transition cursor-pointer"
        >
          {video.thumbnail_url ? (
            // ✅ Pakai thumbnail jika ada
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full aspect-video object-cover"
            />
          ) : (
            // ✅ Kalau nggak ada thumbnail → pakai detik pertama video
            <video
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}#t=0.1`}
              className="w-full aspect-video object-cover"
              muted
              playsInline
              onLoadedMetadata={(e) => {
                const vid = e.currentTarget;
                vid.currentTime = 0.1; // biar nggak hitam
                vid.pause(); // langsung pause di frame pertama
              }}
            />
          )}

          <div className="p-2">
            <h2 className="font-semibold text-sm line-clamp-2">
              {video.title}
            </h2>
            <p className="text-xs text-gray-500">{video.views} views</p>
          </div>
        </Link>
      ))}
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";

export interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

export default function VideoList({ videos }: { videos: Video[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {videos.map((video) => (
        <Link
          key={video.id}
          href={`/watch/${video.id}`}
          className="block bg-white rounded-md overflow-hidden shadow hover:shadow-md transition"
        >
          <div className="relative w-full bg-gray-200" style={{ paddingTop: "56.25%" }}>
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
              alt={video.title}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="p-2 flex gap-2">
            <Image
              src={
                video.profiles?.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${video.profiles?.username || "Unknown"}`
              }
              alt={video.profiles?.username || "Unknown"}
              width={36}
              height={36}
              className="rounded-full"
              unoptimized
            />
            <div className="flex-1">
              <p className="text-sm font-semibold line-clamp-2">{video.title}</p>
              <p className="text-xs text-gray-500">
                {video.profiles?.channel_name || "Unknown"}
              </p>
              <p className="text-xs text-gray-400">
                {video.views}x ditonton •{" "}
                {new Date(video.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

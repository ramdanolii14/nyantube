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
  profiles?: {
    username: string;
    channel_name: string | null;
    avatar_url: string | null;
  };
}

export default function VideoList({ videos }: { videos: Video[] }) {
  if (!videos.length)
    return <p className="text-center mt-10">Antara emang sunyi atau database error T-T</p>;

  return (
    <div className="px-6 md:px-12 lg:px-20"> 
      {/* ✅ Tambahin padding kiri-kanan */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video) => {
          const channelName =
            video.profiles?.channel_name ||
            video.profiles?.username ||
            "Unknown";

          const avatarSrc = video.profiles?.avatar_url
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(
                channelName
              )}&background=random`;

          return (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              className="block rounded-lg overflow-hidden hover:shadow-lg transition bg-white"
            >
              {/* ✅ Thumbnail */}
              {video.thumbnail_url ? (
                <img
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
                  alt={video.title}
                  className="w-full aspect-video object-cover"
                />
              ) : (
                <video
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}#t=0.1`}
                  className="w-full aspect-video object-cover"
                  muted
                  playsInline
                  onLoadedMetadata={(e) => {
                    const vid = e.currentTarget;
                    vid.currentTime = 0.1;
                    vid.pause();
                  }}
                />
              )}

              {/* ✅ Info Video */}
              <div className="flex p-2">
                <img
                  src={avatarSrc}
                  alt={channelName}
                  className="w-8 h-8 rounded-full mr-2"
                />
                <div className="flex-1">
                  <h2 className="font-semibold text-sm line-clamp-2 leading-tight">
                    {video.title}
                  </h2>
                  <p className="text-xs text-gray-600">{channelName}</p>
                  <p className="text-xs text-gray-500">{video.views} views</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

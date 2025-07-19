"use client";

import Link from "next/link";
import Image from "next/image";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  user_id: string;
  profile: {
    username: string;
  };
}

export default function VideoCard({ video }: { video: Video }) {
  return (
    <Link
      href={`/watch/${video.id}`}
      className="group block rounded-lg overflow-hidden shadow-sm hover:shadow-md transition"
    >
      <div className="relative w-full h-48 bg-gray-200">
        <Image
          src={video.thumbnail_url}
          alt={video.title}
          fill
          className="object-cover"
          unoptimized
        />
      </div>

      <div className="p-3">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 group-hover:text-red-600 transition">
          {video.title}
        </h3>
        <p className="text-xs text-gray-600 mt-1">@{video.profile.username}</p>
      </div>
    </Link>
  );
}

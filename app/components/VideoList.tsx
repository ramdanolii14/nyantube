"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";
import {
  Eye,
  Heart,
  Clock,
  History,
} from "lucide-react"; // Icon lucide-react

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  likes: number;
  dislikes: number;
  created_at: string;
  profiles?: {
    channel_name: string;
    avatar_url: string | null;
    is_verified?: boolean;
  };
}

type SortOption = "views" | "latest" | "likes" | "oldest";

const sortOptions: { value: SortOption; label: string; icon: JSX.Element }[] = [
  { value: "views", label: "Most Viewed", icon: <Eye size={16} className="mr-2" /> },
  { value: "latest", label: "Latest", icon: <Clock size={16} className="mr-2" /> },
  { value: "likes", label: "Most Liked", icon: <Heart size={16} className="mr-2" /> },
  { value: "oldest", label: "Oldest", icon: <History size={16} className="mr-2" /> },
];

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("views");

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*, profiles(channel_name, avatar_url, is_verified)");

      if (data) {
        const withDefaults = data.map((v: any) => ({
          ...v,
          profiles: v.profiles || {
            channel_name: "Unknown",
            avatar_url: null,
            is_verified: false,
          },
        })) as Video[];

        setVideos(sortVideos(withDefaults, sortBy));
      }
    };

    fetchVideos();
  }, []);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setVideos((prev) => sortVideos([...prev], option));
  };

  const sortVideos = (data: Video[], option: SortOption): Video[] => {
    switch (option) {
      case "likes":
        return data.sort((a, b) => b.likes - a.likes);
      case "latest":
        return data.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return data.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "views":
      default:
        return data.sort((a, b) => b.views - a.views);
    }
  };

  return (
    <div>
      {/* Header and Sort Control */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm">
          <label htmlFor="sort" className="mr-2 text-gray-700">
            Sort by:
          </label>
          <select
            id="sort"
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="border rounded px-2 py-1 text-sm pl-2 pr-6 bg-white"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/watch/${video.id}`}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-2"
          >
            <div
              className="relative w-full rounded-md overflow-hidden"
              style={{ paddingTop: "56.25%" }}
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
                alt={video.title}
                fill
                className="absolute top-0 left-0 w-full h-full object-cover"
                unoptimized
              />
            </div>

            <div className="flex items-center gap-2 mt-2">
              <Image
                src={
                  video.profiles?.avatar_url
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                    : `https://ui-avatars.com/api/?name=${video.profiles?.channel_name}`
                }
                alt={video.profiles?.channel_name || "Unknown"}
                width={40}
                height={40}
                className="rounded-full object-cover aspect-square"
                unoptimized
              />
              <div className="flex flex-col">
                <h3 className="font-semibold text-sm line-clamp-2">
                  {video.title}
                </h3>
                <p className="text-xs text-gray-600 flex items-center gap-1">
                  {video.profiles?.channel_name}
                  {video.profiles?.is_verified && (
                    <div className="relative group flex items-center">
                      <Image
                        src="/verified.svg"
                        alt="verified"
                        width={12}
                        height={12}
                        className="inline-block align-middle translate-y-[0.5px]"
                      />
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded">
                        VERIFIED USER
                      </div>
                    </div>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {video.views} x ditonton
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

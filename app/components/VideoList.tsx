/**
 * File: src/components/VideoList.tsx
 * Update: Added Skeleton Loading & Lazy Loading Image
 */

"use client";

import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { Listbox, Transition } from "@headlessui/react";
import { Eye, Clock, Heart, History, ChevronsUpDown, Shuffle } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";

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
    is_mod?: boolean;
    is_bughunter?: boolean;
  };
}

type SortOption = "views" | "latest" | "likes" | "oldest" | "random";

const sortOptions: {
  value: SortOption;
  label: string;
  icon: JSX.Element;
}[] = [
  { value: "random", label: "Random Mix", icon: <Shuffle size={16} /> },
  { value: "views", label: "Most Viewed", icon: <Eye size={16} /> },
  { value: "latest", label: "Latest", icon: <Clock size={16} /> },
  { value: "likes", label: "Most Liked", icon: <Heart size={16} className="text-red-500" /> },
  { value: "oldest", label: "Oldest", icon: <History size={16} /> },
];

// KOMPONEN SKELETON (Tampilan saat loading)
const SkeletonCard = () => (
  <div className="flex flex-col gap-4 animate-pulse">
    <div className="relative w-full rounded-2xl bg-gray-200" style={{ paddingTop: "56.25%" }}></div>
    <div className="flex gap-4 px-1">
      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0"></div>
      <div className="flex flex-col gap-2 w-full">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  </div>
);

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true); // State loading
  const [sortBy, setSortBy] = useState<SortOption>("random");

  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("videos")
        .select("*, profiles(channel_name, avatar_url, is_verified, is_mod, is_bughunter)");

      if (data) {
        const withDefaults = data.map((v: any) => ({
          ...v,
          profiles: v.profiles || {
            channel_name: "Unknown",
            avatar_url: null,
            is_verified: false,
            is_mod: false,
            is_bughunter: false,
          },
        })) as Video[];

        setVideos(sortVideos(withDefaults, "random"));
      }
      setLoading(false);
    };

    fetchVideos();
  }, []);

  const handleSortChange = (option: SortOption) => {
    setSortBy(option);
    setVideos((prev) => sortVideos([...prev], option));
  };

  const sortVideos = (data: Video[], option: SortOption): Video[] => {
    const clonedData = [...data];
    switch (option) {
      case "random":
        for (let i = clonedData.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [clonedData[i], clonedData[j]] = [clonedData[j], clonedData[i]];
        }
        return clonedData;
      case "likes":
        return clonedData.sort((a, b) => (b.likes || 0) - (a.likes || 0));
      case "latest":
        return clonedData.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return clonedData.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      case "views":
      default:
        return clonedData.sort((a, b) => (b.views || 0) - (a.views || 0));
    }
  };

  const selectedOption = sortOptions.find((opt) => opt.value === sortBy)!;

  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 py-6">
      {/* Header & Dropdown */}
      <div className="flex justify-between items-center mb-10">
        <h2 className="text-2xl font-black text-gray-900">Explore Videos</h2>
        <div className="w-56">
          <Listbox value={sortBy} onChange={handleSortChange}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-xl border border-gray-200 py-3 pl-4 pr-10 text-left shadow-sm text-sm bg-white hover:bg-gray-50 transition-all font-semibold">
                <span className="flex items-center gap-2">
                  {selectedOption.icon}
                  {selectedOption.label}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <ChevronsUpDown size={18} />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-50 mt-2 w-full rounded-2xl bg-white shadow-2xl border border-gray-100 p-2 text-sm focus:outline-none">
                  {sortOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      className={({ active }) =>
                        `cursor-pointer select-none px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${
                          active ? "bg-gray-100 text-black" : "text-gray-600"
                        }`
                      }
                      value={option.value}
                    >
                      {option.icon}
                      {option.label}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>

      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
        {loading ? (
          // Render 6 Skeleton saat loading
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          videos.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              className="group flex flex-col gap-4"
            >
              {/* Thumbnail - Lazy Loaded by default in Next.js Image */}
              <div
                className="relative w-full rounded-2xl overflow-hidden bg-gray-200 transition-all duration-300 group-hover:rounded-none group-hover:shadow-2xl"
                style={{ paddingTop: "56.25%" }}
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
                  alt={video.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy" // Mengaktifkan Native Lazy Loading
                  unoptimized
                />
              </div>

              {/* Meta Info */}
              <div className="flex gap-4 px-1">
                <div className="flex-shrink-0">
                  <div className="relative w-12 h-12">
                    <Image
                      src={
                        video.profiles?.avatar_url
                          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                          : `https://ui-avatars.com/api/?name=${video.profiles?.channel_name}`
                      }
                      alt={video.profiles?.channel_name || "Avatar"}
                      fill
                      className="rounded-full object-cover border-2 border-transparent transition-colors group-hover:border-blue-500"
                      unoptimized
                    />
                  </div>
                </div>
                
                <div className="flex flex-col min-w-0 pr-4">
                  <h3 className="font-bold text-lg text-gray-900 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">
                    {video.title}
                  </h3>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 font-semibold flex items-center gap-1.5 uppercase tracking-wide">
                      {video.profiles?.channel_name}
                      {video.profiles?.is_verified && <Image src="/verified.svg" alt="v" width={14} height={14} />}
                      {video.profiles?.is_mod && <Image src="/mod.svg" alt="m" width={14} height={14} />}
                      {video.profiles?.is_bughunter && <Image src="/bughunter.svg" alt="b" width={14} height={14} />}
                    </p>
                    <div className="flex items-center text-sm text-gray-400 mt-0.5">
                      <span>{video.views.toLocaleString()} views</span>
                      <span className="mx-2">•</span>
                      <span>{timeAgo(video.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

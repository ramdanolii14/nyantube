/**
 * File: src/components/VideoList.tsx
 * Update: YouTube Ultra-Wide Layout & Max Width Grid
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

const SkeletonCard = () => (
  <div className="flex flex-col gap-3 animate-pulse">
    <div className="relative w-full rounded-xl bg-gray-200" style={{ paddingTop: "56.25%" }}></div>
    <div className="flex gap-3 mt-1">
      <div className="w-10 h-10 rounded-full bg-gray-200 flex-shrink-0"></div>
      <div className="flex flex-col gap-2 w-full">
        <div className="h-4 bg-gray-200 rounded w-[90%]"></div>
        <div className="h-3 bg-gray-200 rounded w-[60%]"></div>
      </div>
    </div>
  </div>
);

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
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
    // Menggunakan max-w-full agar benar-benar memenuhi layar jika monitornya lebar
    <div className="w-full max-w-[2200px] mx-auto px-4 md:px-10 py-6">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Recommended</h2>
        <div className="w-full sm:w-56">
          <Listbox value={sortBy} onChange={handleSortChange}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-lg border border-gray-200 py-2 pl-3 pr-10 text-left shadow-sm text-sm bg-white hover:bg-gray-50 transition-all">
                <span className="flex items-center gap-2 font-medium">
                  {selectedOption.icon}
                  {selectedOption.label}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-400">
                  <ChevronsUpDown size={16} />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-50 mt-2 w-full rounded-xl bg-white shadow-2xl border border-gray-100 p-1.5 text-sm focus:outline-none">
                  {sortOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      className={({ active }) =>
                        `cursor-pointer select-none px-3 py-2.5 rounded-lg flex items-center gap-2.5 transition-colors ${
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

      {/* Video Grid - YouTube Style Scaling */}
      {/* 1 Kolom (Mobile), 2 Kolom (Tablet), 3 Kolom (Desktop Biasa), 4 Kolom (Layar Lebar), 5 Kolom (Ultra-Wide) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-4 gap-y-10">
        {loading ? (
          Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          videos.map((video) => (
            <Link
              key={video.id}
              href={`/watch/${video.id}`}
              className="group flex flex-col gap-3"
            >
              {/* Thumbnail Container */}
              <div
                className="relative w-full rounded-xl overflow-hidden bg-gray-200"
                style={{ paddingTop: "56.25%" }}
              >
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${video.thumbnail_url}`}
                  alt={video.title}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                  className="absolute top-0 left-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  unoptimized
                />
              </div>

              {/* Meta Info */}
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="relative w-9 h-9">
                    <Image
                      src={
                        video.profiles?.avatar_url
                          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                          : `https://ui-avatars.com/api/?name=${video.profiles?.channel_name}`
                      }
                      alt={video.profiles?.channel_name || "Avatar"}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  </div>
                </div>
                
                <div className="flex flex-col min-w-0">
                  <h3 className="font-semibold text-[15px] leading-snug text-gray-900 line-clamp-2">
                    {video.title}
                  </h3>
                  <div className="mt-1 text-[13px] text-gray-600">
                    <p className="hover:text-black flex items-center gap-1">
                      {video.profiles?.channel_name}
                      {video.profiles?.is_verified && <Image src="/verified.svg" alt="v" width={12} height={12} />}
                      {video.profiles?.is_mod && <Image src="/mod.svg" alt="m" width={12} height={12} />}
                      {video.profiles?.is_bughunter && <Image src="/bughunter.svg" alt="b" width={12} height={12} />}
                    </p>
                    <div className="flex items-center">
                      <span>{video.views.toLocaleString()} views</span>
                      <span className="mx-1.5">•</span>
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

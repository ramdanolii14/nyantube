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

// Menambahkan opsi "Random" ke dalam tipe dan daftar opsi
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

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  // Default set ke "random" agar saat pertama buka, urutannya acak
  const [sortBy, setSortBy] = useState<SortOption>("random");

  useEffect(() => {
    const fetchVideos = async () => {
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

        // Terapkan pengurutan awal (Random)
        setVideos(sortVideos(withDefaults, "random"));
      }
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
        // Algoritma Fisher-Yates Shuffle untuk hasil acak yang sempurna
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
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Explore Videos</h2>
        <div className="w-48">
          <Listbox value={sortBy} onChange={handleSortChange}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded-xl border border-gray-200 py-2 pl-3 pr-8 text-left shadow-sm text-sm bg-white hover:bg-gray-50 transition">
                <span className="flex items-center gap-2">
                  {selectedOption.icon}
                  {selectedOption.label}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-gray-400">
                  <ChevronsUpDown size={16} />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-50 mt-2 w-full rounded-xl bg-white shadow-xl border border-gray-100 p-1 text-sm focus:outline-none">
                  {sortOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      className={({ active }) =>
                        `cursor-pointer select-none px-3 py-2.5 rounded-lg flex items-center gap-2 transition ${
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

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-6">
        {videos.map((video) => (
          <Link
            key={video.id}
            href={`/watch/${video.id}`}
            className="group flex flex-col gap-3"
          >
            <div
              className="relative w-full rounded-2xl overflow-hidden bg-gray-100 transition-transform duration-300 group-hover:scale-[1.02]"
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

            <div className="flex gap-3 px-1">
              <div className="flex-shrink-0">
                <Image
                  src={
                    video.profiles?.avatar_url
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                      : `https://ui-avatars.com/api/?name=${video.profiles?.channel_name}`
                  }
                  alt={video.profiles?.channel_name || "Unknown"}
                  width={36}
                  height={36}
                  className="rounded-full object-cover aspect-square border border-gray-100"
                  unoptimized
                />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className="font-bold text-sm line-clamp-2 leading-snug group-hover:text-blue-600 transition">
                  {video.title}
                </h3>
                <div className="mt-1">
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1">
                    {video.profiles?.channel_name}
                    {video.profiles?.is_verified && (
                      <Image src="/verified.svg" alt="v" width={12} height={12} className="inline" />
                    )}
                    {video.profiles?.is_mod && (
                      <Image src="/mod.svg" alt="m" width={12} height={12} className="inline" />
                    )}
                    {video.profiles?.is_bughunter && (
                      <Image src="/bughunter.svg" alt="b" width={12} height={12} className="inline" />
                    )}
                  </p>
                  <div className="flex items-center text-[11px] text-gray-400 mt-0.5">
                    <span>{video.views.toLocaleString()} views</span>
                    <span className="mx-1">•</span>
                    <span>{timeAgo(video.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

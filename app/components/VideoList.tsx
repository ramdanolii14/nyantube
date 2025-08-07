"use client";

import { useEffect, useState, Fragment } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";
import { Listbox, Transition } from "@headlessui/react";
import { Eye, Clock, Heart, History, ChevronsUpDown } from "lucide-react";
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

type SortOption = "views" | "latest" | "likes" | "oldest";

const sortOptions: {
  value: SortOption;
  label: string;
  icon: JSX.Element;
}[] = [
  { value: "views", label: "Most Viewed", icon: <Eye size={16} /> },
  { value: "latest", label: "Latest", icon: <Clock size={16} /> },
  { value: "likes", label: "Most Liked", icon: <Heart size={16} className="text-red-500" /> },
  { value: "oldest", label: "Oldest", icon: <History size={16} /> },
];

export default function VideoList() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("views");

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

  const selectedOption = sortOptions.find((opt) => opt.value === sortBy)!;

  return (
    <div>
      {/* Header and Custom Sort Dropdown */}
      <div className="flex justify-between items-center mb-4">
        <div className="w-48">
          <Listbox value={sortBy} onChange={handleSortChange}>
            <div className="relative">
              <Listbox.Button className="relative w-full cursor-pointer rounded border py-1.5 pl-3 pr-8 text-left shadow-sm text-sm bg-white">
                <span className="flex items-center gap-2">
                  {selectedOption.icon}
                  {selectedOption.label}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
                  <ChevronsUpDown size={16} />
                </span>
              </Listbox.Button>

              <Transition
                as={Fragment}
                leave="transition ease-in duration-100"
                leaveFrom="opacity-100"
                leaveTo="opacity-0"
              >
                <Listbox.Options className="absolute z-50 mt-1 w-full rounded-md bg-white shadow-lg border text-sm">
                  {sortOptions.map((option) => (
                    <Listbox.Option
                      key={option.value}
                      className={({ active }) =>
                        `cursor-pointer select-none px-3 py-2 flex items-center gap-2 ${
                          active ? "bg-gray-100" : ""
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

      {/* Videos Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
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
                        title="AKUN TERVERIFIKASI"
                        width={12}
                        height={12}
                        className="inline-block align-middle translate-y-[0.5px]"
                      />
                    </div>
                  )}
                  {video.profiles?.is_mod && (
                    <div className="relative group flex items-center">
                      <Image
                        src="/mod.svg"
                        alt="admin"
                        title="TERVERIFIKASI ADMIN"
                        width={12}
                        height={12}
                        className="inline-block align-middle translate-y-[0.5px]"
                      />
                    </div>
                  )}
                  {video.profiles?.is_bughunter && (
                    <div className="relative group flex items-center">
                      <Image
                        src="/bughunter.svg"
                        alt="bughunter"
                        title="TERVERIFIKASI BUGHUNTER"
                        width={12}
                        height={12}
                        className="inline-block align-middle translate-y-[0.5px]"
                      />
                    </div>
                  )}
                </p>
                <p className="text-xs text-gray-500">
                  {video.views} x ditonton
                </p>
                <p className="text-xs text-gray-500">
                  {timeAgo(video.created_at)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}




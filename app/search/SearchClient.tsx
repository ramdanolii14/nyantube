"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  id: string;
  username: string;
  channel_name: string;
  avatar_url: string | null;
  is_verified?: boolean;
}

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  profiles?: Profile;
}

export default function SearchClient() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q")?.toLowerCase() ?? "";

  const [channels, setChannels] = useState<Profile[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);

      // Fetch matching channels
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, username, channel_name, avatar_url, is_verified")
        .or(`username.ilike.%${query}%,channel_name.ilike.%${query}%`);

      setChannels(profileData || []);

      // Fetch matching videos
      const { data: videoData } = await supabase
        .from("videos")
        .select("*, profiles(channel_name, avatar_url, is_verified, username)")
        .ilike("title", `%${query}%`)
        .order("created_at", { ascending: false });

      if (videoData) {
        setVideos(
          videoData.map((v: any) => ({
            ...v,
            profiles: v.profiles || {
              channel_name: "Unknown",
              avatar_url: null,
              is_verified: false,
              username: "#",
            },
          })) as Video[]
        );
      }

      setLoading(false);
    };

    if (query.trim()) fetchResults();
    else {
      setChannels([]);
      setVideos([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="mt-20 px-4 max-w-7xl mx-auto">
      <h1 className="text-xl font-semibold mb-6">
        Hasil pencarian untuk "{query}"
      </h1>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Section: Channel Matches */}
          {channels.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-semibold mb-4">Channel Terkait</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {channels.map((channel) => (
                  <Link
                    key={channel.id}
                    href={`/${channel.username}`}
                    className="flex flex-col items-center text-center hover:bg-gray-50 p-3 rounded"
                  >
                    <Image
                      src={
                        channel.avatar_url
                          ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${channel.avatar_url}`
                          : `https://ui-avatars.com/api/?name=${channel.channel_name}`
                      }
                      alt={channel.channel_name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover aspect-square"
                      unoptimized
                    />
                    <p className="mt-2 text-sm font-medium truncate max-w-[8rem]">
                      {channel.channel_name}
                    </p>
                    {channel.is_verified && (
                      <Image
                        src="/verified.svg"
                        alt="verified"
                        width={12}
                        height={12}
                        className="inline-block mt-1"
                      />
                    )}
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Section: Video Matches */}
          <section>
            <h2 className="text-lg font-semibold mb-4">Video Terkait</h2>
            {videos.length === 0 ? (
              <p>Tidak ada video ditemukan.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {videos.map((video) => (
                  <Link
                    key={video.id}
                    href={`/watch/${video.id}`}
                    className="bg-white rounded-lg shadow hover:shadow-lg transition p-2"
                  >
                    {/* Thumbnail */}
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

                    {/* Info */}
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
                            <Image
                              src="/verified.svg"
                              alt="verified"
                              width={12}
                              height={12}
                            />
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {video.views} views
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

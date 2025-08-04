"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  id: string;
  username: string;
  channel_name: string;
  avatar_url: string | null;
  is_verified?: boolean;
  is_mod?: boolean;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
}

export default function PublicProfilePage({ username }: { username: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [avatarSrc, setAvatarSrc] = useState<string>("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, channel_name, avatar_url, is_verified, is_mod, created_at")
        .eq("username", username)
        .single();

      if (data) {
        setProfile(data as Profile);
        setAvatarSrc(
          data.avatar_url
            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${data.avatar_url}`
            : `https://ui-avatars.com/api/?name=${encodeURIComponent(data.username)}`
        );
      }
    };

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };

    fetchUser();
    fetchProfile();
  }, [username]);

  const fetchVideos = async (user_id: string) => {
    const { data } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, views, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (data) setVideos(data as Video[]);
  };

  useEffect(() => {
    if (profile?.id) {
      fetchVideos(profile.id);
    }
  }, [profile]);

  const handleDeleteVideo = async (videoId: string) => {
    const confirmDelete = confirm("Yakin ingin menghapus video ini?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("videos").delete().eq("id", videoId);
    if (!error) {
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      alert("Video berhasil dihapus!");
    } else {
      alert("Gagal menghapus video!");
    }
  };

  if (!profile) return <p className="text-center mt-10">Loading profile...</p>;

  return (
    <div className="max-w-5xl mx-auto mt-20 px-4">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border">
          <Image
            src={avatarSrc}
            alt={profile.username}
            width={80}
            height={80}
            className="object-cover w-full h-full"
            unoptimized
            onError={() =>
              setAvatarSrc(
                `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.username)}`
              )
            }
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-1">
            {profile.channel_name}
            {profile.is_verified && (
              <Image src="/verified.svg" alt="verified" width={16} height={16} />
            )}
            {profile.is_mod && (
              <Image src="/mod.svg" alt="moderator" width={16} height={16} />
            )}
          </h1>
          <p className="text-gray-500">@{profile.username}</p>
        </div>

        {userId === profile.id && (
          <Link
            href={`/profile/${profile.id}/edit`}
            className="ml-auto bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Edit Profile
          </Link>
        )}
      </div>

      <hr className="my-5" />

      <h2 className="text-xl font-bold mb-3">
        Video dari {profile.channel_name}
      </h2>
      {videos.length === 0 ? (
        <p className="text-gray-500">Belum ada video diunggah.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {videos.map((v) => (
            <div
              key={v.id}
              className="border rounded-md overflow-hidden hover:shadow-md transition relative group"
            >
              <Link href={`/watch/${v.id}`}>
                <Image
                  src={
                    v.thumbnail_url
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`
                      : "/default-thumbnail.jpg"
                  }
                  alt={v.title}
                  width={400}
                  height={225}
                  className="w-full h-40 object-cover"
                  unoptimized
                />
                <div className="p-2">
                  <h3 className="font-semibold text-sm line-clamp-2">
                    {v.title}
                  </h3>
                  <p className="text-xs text-gray-500">{v.views} views</p>
                </div>
              </Link>

              {userId === profile.id && (
                <button
                  onClick={() => handleDeleteVideo(v.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                  title="Hapus Video"
                >
                  🗑
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

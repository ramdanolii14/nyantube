"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
}

export default function ProfilePage() {
  const { id } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, channel_name, avatar_url, is_verified")
        .eq("id", id)
        .single();
      if (data) setProfile(data as Profile);
    };

    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("id, title, thumbnail_url, views, created_at")
        .eq("user_id", id)
        .order("created_at", { ascending: false });
      if (data) setVideos(data as Video[]);
    };

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };

    fetchProfile();
    fetchVideos();
    fetchUser();
  }, [id]);

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
      {/* ✅ Profile Header */}
      <div className="flex items-center gap-4">
        <Image
          src={
            profile.avatar_url
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
              : `https://ui-avatars.com/api/?name=${profile.username}`
          }
          alt={profile.username}
          width={80}
          height={80}
          className="rounded-full"
          unoptimized
        />
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-1">
            {profile.channel_name}
            {profile.is_verified && (
              <div className="relative group inline-block">
                <Image
                  src="/verified.svg"
                  alt="verified"
                  width={16}
                  height={16}
                  className="inline-block align-middle"
                />
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded">
                  VERIFIED USER
                </div>
              </div>
            )}
          </h1>
          <p className="text-gray-500">@{profile.username}</p>
        </div>

        {/* ✅ Tombol Edit hanya muncul kalau pemiliknya sendiri */}
        {userId === id && (
          <Link
            href={`/profile/${id}/edit`}
            className="ml-auto bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Edit Profile
          </Link>
        )}
      </div>

      <hr className="my-5" />

      {/* ✅ User's Videos */}
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

              {/* ✅ Tombol Hapus */}
              {userId === id && (
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

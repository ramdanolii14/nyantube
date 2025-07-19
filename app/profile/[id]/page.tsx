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
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  likes: number;
  dislikes: number;
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
        .select("*")
        .eq("id", id)
        .single();
      if (data) setProfile(data as Profile);
    };

    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
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
          <h1 className="text-2xl font-bold">{profile.channel_name}</h1>
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
      <h2 className="text-xl font-bold mb-3">Video dari {profile.channel_name}</h2>
      {videos.length === 0 ? (
        <p className="text-gray-500">Belum ada video diunggah.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {videos.map((v) => (
            <Link
              key={v.id}
              href={`/watch/${v.id}`}
              className="border rounded-md overflow-hidden hover:shadow-md transition"
            >
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
                <h3 className="font-semibold text-sm">{v.title}</h3>
                <p className="text-xs text-gray-500">
                  👍 {v.likes} | 👎 {v.dislikes}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

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
  is_bughunter?: boolean;
  created_at: string;
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
  is_deleted?: boolean;
}

export default function PublicProfilePage({ username }: { username: string }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isMod, setIsMod] = useState<boolean>(false);
  const [avatarSrc, setAvatarSrc] = useState<string>("");

  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [fadeOut, setFadeOut] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);

  // Auto fade-out popup
  useEffect(() => {
    if (popupMessage) {
      setFadeOut(false);
      const fadeTimer = setTimeout(() => setFadeOut(true), 4500);
      const removeTimer = setTimeout(() => setPopupMessage(null), 5000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [popupMessage]);

  // Fetch profile + user auth
  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, channel_name, avatar_url, is_verified, is_mod, is_bughunter, created_at")
        .eq("username", username)
        .single();

      if (data) {
        setProfile(data as Profile);

        if (data.avatar_url) {
          const { data: publicUrl } = supabase.storage
            .from("avatars")
            .getPublicUrl(data.avatar_url);
          setAvatarSrc(publicUrl.publicUrl);
        } else {
          const bgColor = Math.floor(Math.random() * 16777215).toString(16);
          setAvatarSrc(
            `https://ui-avatars.com/api/?name=${encodeURIComponent(
              data.channel_name
            )}&background=${bgColor}&color=fff`
          );
        }
      }
    };

    const fetchUser = async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (auth.user) {
        setUserId(auth.user.id);

        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("is_mod")
          .eq("id", auth.user.id)
          .single();

        setIsMod(currentProfile?.is_mod || false);
      }
    };

    fetchUser();
    fetchProfile();
  }, [username]);

  // Fetch videos
  const fetchVideos = async (user_id: string) => {
    const { data } = await supabase
      .from("videos")
      .select("id, title, video_url, thumbnail_url, views, created_at, is_deleted")
      .eq("user_id", user_id)
      .eq("is_deleted", false) // hanya tampilkan yg aktif
      .order("created_at", { ascending: false });

    if (data) setVideos(data as Video[]);
  };

  useEffect(() => {
    if (profile?.id) {
      fetchVideos(profile.id);
    }
  }, [profile]);

  // Confirm delete popup
  const confirmDeleteVideo = (video: Video) => {
    setVideoToDelete(video);
    setShowConfirm(true);
  };

  // Handle delete video
  const handleDeleteConfirmed = async () => {
    if (!videoToDelete) return;
    const video = videoToDelete;

    if (isMod) {
      // 🔴 admin hapus permanen
      const { error } = await supabase.from("videos").delete().eq("id", video.id);
      if (error) {
        setPopupType("error");
        setPopupMessage("Gagal menghapus video!");
        setShowConfirm(false);
        return;
      }

      if (video.video_url) {
        const fileName = video.video_url.split("/").pop();
        if (fileName) await supabase.storage.from("videos").remove([fileName]);
      }

      if (video.thumbnail_url) {
        const fileName = video.thumbnail_url.split("/").pop();
        if (fileName) await supabase.storage.from("thumbnails").remove([fileName]);
      }
    } else {
      // 🟡 user biasa → soft delete
      const { error } = await supabase
        .from("videos")
        .update({ is_deleted: true })
        .eq("id", video.id);

      if (error) {
        setPopupType("error");
        setPopupMessage("Gagal menghapus video!");
        setShowConfirm(false);
        return;
      }
    }

    setVideos((prev) => prev.filter((v) => v.id !== video.id));
    setPopupType("success");
    setPopupMessage("Video berhasil dihapus!");
    setShowConfirm(false);
  };

  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      {profile && (
        <div className="flex items-center gap-4 mb-6">
          <Image
            src={avatarSrc}
            alt={profile.channel_name}
            width={80}
            height={80}
            className="rounded-full"
          />
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {profile.channel_name}
              {profile.is_verified && (
                <span className="text-blue-500">✔</span>
              )}
              {profile.is_mod && (
                <span className="text-green-600">[MOD]</span>
              )}
              {profile.is_bughunter && (
                <span className="text-yellow-600">[BUG]</span>
              )}
            </h1>
            <p className="text-gray-600">@{profile.username}</p>
            <p className="text-sm text-gray-500">
              Bergabung: {new Date(profile.created_at).toLocaleDateString()}
            </p>
            <p className="text-sm text-gray-500">
              {totalVideos} video · {totalViews} views
            </p>
          </div>
        </div>
      )}

      {/* Videos */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {videos.map((video) => (
          <div key={video.id} className="relative border rounded-md overflow-hidden">
            <Link href={`/watch/${video.id}`}>
              <Image
                src={video.thumbnail_url || "/default-thumbnail.jpg"}
                alt={video.title}
                width={400}
                height={225}
                className="w-full h-40 object-cover"
              />
              <div className="p-2">
                <h2 className="text-sm font-semibold line-clamp-2">{video.title}</h2>
                <p className="text-xs text-gray-500">{video.views} views</p>
              </div>
            </Link>
            {(userId === profile?.id || isMod) && (
              <button
                onClick={() => confirmDeleteVideo(video)}
                className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs rounded"
              >
                Hapus
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Popup Message */}
      {popupMessage && (
        <div
          className={`fixed bottom-4 right-4 px-4 py-2 rounded shadow-lg text-white transition-opacity duration-500 ${
            popupType === "success" ? "bg-green-600" : "bg-red-600"
          } ${fadeOut ? "opacity-0" : "opacity-100"}`}
        >
          {popupMessage}
        </div>
      )}

      {/* Confirm Modal */}
      {showConfirm && videoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full">
            <h2 className="text-lg font-semibold mb-4">Konfirmasi Hapus</h2>
            <p className="text-sm mb-4">
              {isMod
                ? "Apakah Anda yakin ingin menghapus permanen video ini?"
                : "Apakah Anda yakin ingin menghapus video ini? (dapat dipulihkan oleh admin)"}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-3 py-1 rounded bg-gray-300"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteConfirmed}
                className="px-3 py-1 rounded bg-red-600 text-white"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

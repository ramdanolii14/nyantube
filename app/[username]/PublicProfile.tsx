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
  const [isMod, setIsMod] = useState<boolean>(false);
  const [avatarSrc, setAvatarSrc] = useState<string>("");

  // Popup message
  const [popupMessage, setPopupMessage] = useState<string | null>(null);
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const [fadeOut, setFadeOut] = useState(false);

  // Delete confirmation popup
  const [showConfirm, setShowConfirm] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<Video | null>(null);

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

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, channel_name, avatar_url, is_verified, is_mod, created_at")
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

  const fetchVideos = async (user_id: string) => {
    const { data } = await supabase
      .from("videos")
      .select("id, title, video_url, thumbnail_url, views, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (data) setVideos(data as Video[]);
  };

  useEffect(() => {
    if (profile?.id) {
      fetchVideos(profile.id);
    }
  }, [profile]);

  const confirmDeleteVideo = (video: Video) => {
    setVideoToDelete(video);
    setShowConfirm(true);
  };

  const handleDeleteConfirmed = async () => {
    if (!videoToDelete) return;

    const video = videoToDelete;

    const { error } = await supabase.from("videos").delete().eq("id", video.id);
    if (error) {
      setPopupType("error");
      setPopupMessage("Gagal menghapus video!");
      setShowConfirm(false);
      return;
    }

    // Hapus file di bucket videos
    if (video.video_url) {
      const fileName = video.video_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("videos").remove([fileName]);
      }
    }

    // Hapus file di bucket thumbnails
    if (video.thumbnail_url) {
      const fileName = video.thumbnail_url.split("/").pop();
      if (fileName) {
        await supabase.storage.from("thumbnails").remove([fileName]);
      }
    }

    setVideos((prev) => prev.filter((v) => v.id !== video.id));
    setPopupType("success");
    setPopupMessage("Video berhasil dihapus!");
    setShowConfirm(false);
  };

  const totalVideos = videos.length;
  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);

  if (!profile) {
    return (
      <div className="max-w-5xl mx-auto mt-20 px-4 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-300" />
          <div className="flex-1">
            <div className="h-6 w-40 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-300 rounded"></div>
          </div>
        </div>
        <div className="mt-8 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto mt-20 px-4">
      {/* Popup Notification */}
      {popupMessage && (
        <div
          className={`fixed top-20 left-1/2 transform -translate-x-1/2 ${
            popupType === "success"
              ? "bg-green-100 border border-green-400 text-green-700"
              : "bg-red-100 border border-red-400 text-red-700"
          } px-4 py-2 rounded shadow-lg transition-all duration-500 ${
            fadeOut ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
          }`}
        >
          {popupMessage}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirm && videoToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center">
            <h2 className="text-lg font-semibold mb-2">Are you sure?</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete this video? We can't restore your video if you confirm the deletion.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDeleteConfirmed}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
            onError={() => {
              const bgColor = Math.floor(Math.random() * 16777215).toString(16);
              setAvatarSrc(
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  profile.channel_name
                )}&background=${bgColor}&color=fff`
              );
            }}
          />
        </div>

        <div>
          <h1 className="text-2xl font-bold flex items-center gap-1">
            {profile.channel_name}
            {profile.is_verified && (
              <Image src="/verified.svg" alt="verified" width={16} height={16} title="Verified User" />
            )}
            {profile.is_mod && (
              <Image src="/mod.svg" alt="moderator" width={16} height={16} title="Verified Admin" />
            )}
          </h1>
          <p className="text-gray-500">@{profile.username}</p>
          <div className="text-sm text-gray-600 mt-1 flex flex-col">
            <span>Video: {totalVideos}</span>
            <span>Views: {totalViews}</span>
          </div>
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
          {videos.map((v) => {
            const canDelete = userId === profile.id || isMod;
            return (
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

                {canDelete && (
                  <button
                    onClick={() => confirmDeleteVideo(v)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="Hapus Video"
                  >
                    🗑
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

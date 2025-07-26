"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/supabase/client";

// ✅ Tipe Video (sudah ada thumbnail_url & channel_name)
interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
    channel_name?: string;
  };
}

// ✅ Tipe Komentar
interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      // ✅ Ambil video utama
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select(
          `
          id, title, description, video_url, thumbnail_url, views, created_at,
          profiles (username, avatar_url, channel_name)
        `
        )
        .eq("id", id)
        .single();

      if (videoError) throw videoError;
      setVideo(videoData as Video);

      // ✅ Tambah views
      await supabase.from("videos").update({ views: (videoData.views || 0) + 1 }).eq("id", id);

      // ✅ Ambil komentar
      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(
          `
          id, user_id, content, created_at,
          profiles (username, avatar_url)
        `
        )
        .eq("video_id", id)
        .order("created_at", { ascending: false });

      if (commentsError) throw commentsError;
      setComments(
        commentsData.map((c) => ({
          ...c,
          profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
        }))
      );

      // ✅ Ambil video rekomendasi
      const { data: relatedData, error: relatedError } = await supabase
        .from("videos")
        .select(
          `
          id, title, thumbnail_url, views, created_at,
          profiles (username, channel_name)
        `
        )
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (relatedError) throw relatedError;
      setRelatedVideos(relatedData as Video[]);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleComment = async () => {
    if (!newComment.trim()) return;
    const { data, error } = await supabase.from("comments").insert([{ video_id: id, content: newComment }]);
    if (!error) {
      setNewComment("");
      fetchData();
    }
  };

  if (!video) return <p className="text-center mt-10">Loading video...</p>;

  return (
    <div className="max-w-6xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* ✅ VIDEO UTAMA */}
      <div className="md:col-span-2">
        <video src={video.video_url} controls className="w-full rounded-md" />

        <h1 className="text-lg font-semibold mt-3">{video.title}</h1>
        <p className="text-sm text-gray-500">
          {video.views}x ditonton • {new Date(video.created_at).toLocaleDateString()}
        </p>

        <div className="flex items-center gap-2 mt-3">
          <Image
            src={
              video.profiles?.avatar_url
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                : `https://ui-avatars.com/api/?name=${video.profiles?.username || "Unknown"}`
            }
            alt={video.profiles?.username || "Unknown"}
            width={40}
            height={40}
            className="rounded-full"
            unoptimized
          />
          <div>
            <p className="text-sm font-semibold">{video.profiles?.channel_name || "Unknown"}</p>
            <p className="text-xs text-gray-500">{video.profiles?.username}</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{video.description}</p>

        {/* ✅ KOMENTAR */}
        <div className="mt-6">
          <h2 className="text-md font-semibold mb-2">Komentar</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Tulis komentar..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 border rounded-md px-3 py-2 text-sm"
            />
            <button
              onClick={handleComment}
              className="bg-red-500 text-white px-4 py-2 rounded-md text-sm"
            >
              Kirim
            </button>
          </div>

          {comments.map((c) => (
            <div key={c.id} className="flex gap-2 mb-3">
              <Image
                src={
                  c.profiles.avatar_url
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${c.profiles.avatar_url}`
                    : `https://ui-avatars.com/api/?name=${c.profiles.username}`
                }
                alt={c.profiles.username}
                width={32}
                height={32}
                className="rounded-full"
                unoptimized
              />
              <div>
                <p className="text-sm font-semibold">{c.profiles.username}</p>
                <p className="text-sm">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ VIDEO REKOMENDASI */}
      <div className="space-y-3">
        {relatedVideos.map((v) => (
          <div key={v.id} className="flex gap-2">
            <div className="relative w-40 h-24 bg-gray-200 rounded-md overflow-hidden">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
                alt={v.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold line-clamp-2">{v.title}</p>
              <p className="text-xs text-gray-500">{v.profiles?.channel_name || "Unknown"}</p>
              <p className="text-xs text-gray-400">{v.views}x ditonton</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

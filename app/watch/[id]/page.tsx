"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  user_id: string;
  created_at: string;
  likes: number;
  dislikes: number;
  profiles?: {
    username: string;
    avatar_url: string | null;
  };
}

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
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  // ✅ Ambil user login
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  // ✅ Ambil video & komentar
useEffect(() => {
  const fetchVideoAndComments = async () => {
    // --- Ambil Video ---
    const { data: videoData } = await supabase
      .from("videos")
      .select("*, profiles(username, avatar_url)")
      .eq("id", id)
      .single();

    if (videoData) {
      setVideo({
        ...videoData,
        profiles:
          videoData.profiles || { username: "Unknown", avatar_url: null },
      });
    }

    // --- Ambil Komentar ---
    const { data: commentsData } = await supabase
      .from("comments")
      .select(
        "id, user_id, content, created_at, profiles(username, avatar_url)"
      )
      .eq("video_id", id)
      .order("created_at", { ascending: false });

    if (commentsData) {
      setComments(
        commentsData.map((c: any) => ({
          ...c,
          profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
        })) as Comment[]
      );
    }
  };

  // ✅ Panggil di luar fungsi, bukan di dalamnya
  fetchVideoAndComments();
}, [id]);

  // ✅ Tambah Komentar
  const handleAddComment = async () => {
    if (!newComment.trim() || !userId) return;

    await supabase.from("comments").insert([
      {
        video_id: id,
        user_id: userId,
        content: newComment.trim(),
      },
    ]);

    setNewComment("");

    // Refresh komentar
    const { data } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at, profiles(username, avatar_url)")
      .eq("video_id", id)
      .order("created_at", { ascending: false });

    if (data) setComments(data as Comment[]);
  };

  if (!video) return <p className="text-center mt-20">Loading video...</p>;

  return (
    <div className="max-w-4xl mx-auto mt-10 px-4">
      {/* ✅ Video */}
      <div className="relative w-full rounded-md overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
        <video
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
          controls
          className="absolute top-0 left-0 w-full h-full"
        />
      </div>

      <h1 className="text-xl font-bold mt-4">{video.title}</h1>
      <p className="text-gray-600 text-sm">{video.description}</p>

      <hr className="my-4" />

      {/* ✅ Komentar */}
      <h2 className="text-lg font-bold mb-3">Komentar</h2>
      {userId && (
        <div className="mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Tulis komentar..."
            className="border p-2 rounded w-full mb-2"
          />
          <button
            onClick={handleAddComment}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            Kirim
          </button>
        </div>
      )}

      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-3">
            <Image
              src={
                c.profiles.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${c.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${c.profiles.username}`
              }
              alt={c.profiles.username}
              width={40}
              height={40}
              className="rounded-full"
              unoptimized
            />
            <div className="bg-gray-100 p-2 rounded w-full">
              <p className="text-sm font-semibold">{c.profiles.username}</p>
              <p className="text-sm">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

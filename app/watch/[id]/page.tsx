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
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

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

  // ✅ Ambil video + komentar + rekomendasi + hitung likes/dislikes real-time
  useEffect(() => {
    const fetchVideo = async () => {
      const { data: videoData } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .single();

      if (videoData) {
        const { count: likeCount } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", id)
          .eq("type", "like");

        const { count: dislikeCount } = await supabase
          .from("video_likes")
          .select("*", { count: "exact", head: true })
          .eq("video_id", id)
          .eq("type", "dislike");

        const { data: profileData } = await supabase
          .from("profiles")
          .select("username, avatar_url")
          .eq("id", videoData.user_id)
          .single();

        setVideo({
          ...videoData,
          likes: likeCount || 0,
          dislikes: dislikeCount || 0,
          profiles: profileData || { username: "Unknown", avatar_url: null },
        });
      }
    };

    const fetchComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select(
          "id, user_id, content, created_at, profiles(username, avatar_url)"
        )
        .eq("video_id", id)
        .order("created_at", { ascending: false });
      if (data) setComments(data as Comment[]);
    };

    const fetchRecommendations = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*")
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        // hitung likes/dislikes juga untuk rekomendasi
        const videosWithCounts: Video[] = [];
        for (const v of data) {
          const { count: likeCount } = await supabase
            .from("video_likes")
            .select("*", { count: "exact", head: true })
            .eq("video_id", v.id)
            .eq("type", "like");

          const { count: dislikeCount } = await supabase
            .from("video_likes")
            .select("*", { count: "exact", head: true })
            .eq("video_id", v.id)
            .eq("type", "dislike");

          videosWithCounts.push({
            ...v,
            likes: likeCount || 0,
            dislikes: dislikeCount || 0,
          });
        }
        setRecommendations(videosWithCounts);
      }
    };

    fetchVideo();
    fetchComments();
    fetchRecommendations();
  }, [id]);

  // ✅ Fungsi Like/Dislike real-time
  const handleLike = async (type: "like" | "dislike") => {
    if (!userId) {
      setMessage("❌ Anda harus login untuk like/dislike");
      return;
    }

    try {
      const { data: existing } = await supabase
        .from("video_likes")
        .select("id, type")
        .eq("video_id", id)
        .eq("user_id", userId)
        .single();

      if (!existing) {
        await supabase.from("video_likes").insert([
          { video_id: id, user_id: userId, type },
        ]);
      } else if (existing.type !== type) {
        await supabase
          .from("video_likes")
          .update({ type })
          .eq("id", existing.id);
      } else {
        await supabase.from("video_likes").delete().eq("id", existing.id);
      }

      // ✅ Refresh count setelah klik
      const { count: likeCount } = await supabase
        .from("video_likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", id)
        .eq("type", "like");

      const { count: dislikeCount } = await supabase
        .from("video_likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", id)
        .eq("type", "dislike");

      setVideo((prev) =>
        prev
          ? {
              ...prev,
              likes: likeCount || 0,
              dislikes: dislikeCount || 0,
            }
          : prev
      );
    } catch (err: any) {
      console.error("LIKE ERROR:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !userId) return;
    try {
      await supabase.from("comments").insert([
        { video_id: id, user_id: userId, content: newComment.trim() },
      ]);
      setNewComment("");

      const { data } = await supabase
        .from("comments")
        .select(
          "id, user_id, content, created_at, profiles(username, avatar_url)"
        )
        .eq("video_id", id)
        .order("created_at", { ascending: false });
      if (data) setComments(data as Comment[]);
    } catch (err: any) {
      console.error("COMMENT ERROR:", err);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!userId) return;
    try {
      await supabase.from("comments").delete().eq("id", commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: any) {
      console.error("DELETE COMMENT ERROR:", err);
    }
  };

  if (!video) return <p className="text-center mt-20">Loading video...</p>;

  return (
    <div className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 px-3">
      {/* ✅ VIDEO MAIN CONTENT */}
      <div className="md:col-span-2">
        <div
          className="relative w-full rounded-md overflow-hidden bg-black"
          style={{ paddingTop: "56.25%" }}
        >
          <video
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
            controls
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
        <Link
            href={`/profile/${video.user_id}`}
            className="flex items-center gap-3 hover:opacity-80 transition"
        >
            <Image
            src={
                video.profiles?.avatar_url
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                : `https://ui-avatars.com/api/?name=${video.profiles?.username}`
            }
            alt={video.profiles?.username || "Channel"}
            width={45}
            height={45}
            className="rounded-full"
            unoptimized
            />
            <div>
            <p className="font-bold">{video.profiles?.username}</p>
            <p className="text-sm text-gray-500">Lihat Channel</p>
            </div>
        </Link>
        </div>

        <p className="text-sm text-gray-500 mt-2">{video.description}</p>

        <div className="flex gap-4 mt-3">
          <button
            onClick={() => handleLike("like")}
            className="bg-green-500 text-white px-3 py-1 rounded"
          >
            👍 {video.likes}
          </button>
          <button
            onClick={() => handleLike("dislike")}
            className="bg-red-500 text-white px-3 py-1 rounded"
          >
            👎 {video.dislikes}
          </button>
        </div>

        <hr className="my-5" />

        {/* ✅ KOMENTAR */}
        <h2 className="text-xl font-bold mb-3">Komentar</h2>
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
                {c.user_id === userId && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-xs text-red-500 mt-1"
                  >
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ REKOMENDASI VIDEO */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold mb-2">Rekomendasi</h2>
        {recommendations.map((v) => (
          <Link
            key={v.id}
            href={`/watch/${v.id}`}
            className="flex gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <Image
              src={
                v.thumbnail_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`
                  : "/default-thumbnail.png"
              }
              alt={v.title}
              width={120}
              height={70}
              className="rounded"
            />
            <div>
              <p className="text-sm font-semibold line-clamp-2">{v.title}</p>
              <p className="text-xs text-gray-500">{v.likes} Likes</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

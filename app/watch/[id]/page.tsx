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
  const { id } = useParams() as { id: string };
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userLikeType, setUserLikeType] = useState<"like" | "dislike" | null>(
    null
  );

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

  // ✅ Ambil video, komentar, rekomendasi
  useEffect(() => {
    if (!id) return;

    const fetchVideoAndComments = async () => {
      // --- Ambil Video Utama ---
      const { data: videoData } = await supabase
        .from("videos")
        .select("*, profiles(username, avatar_url)")
        .eq("id", id)
        .single();

      if (videoData) {
        setVideo({
          ...videoData,
          profiles: videoData.profiles || {
            username: "Unknown",
            avatar_url: null,
          },
        });

        // ✅ Update views (+1 setiap load)
        await supabase.rpc("increment_views", { video_id_input: id });

        // ✅ Ambil status like user
        if (userId) {
          const { data: likeData } = await supabase
            .from("video_likes")
            .select("type")
            .eq("video_id", id)
            .eq("user_id", userId)
            .maybeSingle();
          if (likeData) setUserLikeType(likeData.type);
        }
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

      // --- Ambil Video Rekomendasi (LIMIT 5) ---
      const { data: recommendedData } = await supabase
        .from("videos")
        .select("*, profiles(username, avatar_url)")
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (recommendedData) {
        setRecommended(
          recommendedData.map((v: any) => ({
            ...v,
            profiles: v.profiles || {
              username: "Unknown",
              avatar_url: null,
            },
          })) as Video[]
        );
      }
    };

    fetchVideoAndComments();
  }, [id, userId]);

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

    const { data } = await supabase
      .from("comments")
      .select(
        "id, user_id, content, created_at, profiles(username, avatar_url)"
      )
      .eq("video_id", id)
      .order("created_at", { ascending: false });

    if (data) {
      setComments(
        data.map((c: any) => ({
          ...c,
          profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
        })) as Comment[]
      );
    }
  };

  // ✅ Like & Dislike anti-spam
  const handleLikeDislike = async (type: "like" | "dislike") => {
    if (!userId) {
      alert("Kamu harus login untuk memberikan like atau dislike.");
      return;
    }

    const { data: existing } = await supabase
      .from("video_likes")
      .select("*")
      .eq("video_id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (!existing) {
      await supabase.from("video_likes").insert([
        { video_id: id, user_id: userId, type: type },
      ]);
      setUserLikeType(type);
    } else if (existing.type === type) {
      await supabase.from("video_likes").delete().eq("id", existing.id);
      setUserLikeType(null);
    } else {
      await supabase
        .from("video_likes")
        .update({ type: type })
        .eq("id", existing.id);
      setUserLikeType(type);
    }

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

    await supabase
      .from("videos")
      .update({ likes: likeCount || 0, dislikes: dislikeCount || 0 })
      .eq("id", id);

    setVideo((prev) =>
      prev
        ? { ...prev, likes: likeCount || 0, dislikes: dislikeCount || 0 }
        : prev
    );
  };

  if (!video) return <p className="text-center mt-20">Loading video...</p>;

  return (
    <div className="max-w-6xl mx-auto pt-24 px-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50">
      {/* ✅ Kolom Kiri */}
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

        <Link
          href={`/profile/${video.user_id}`}
          className="flex items-center gap-3 mt-6 hover:opacity-80"
        >
          <Image
            src={
              video.profiles?.avatar_url
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                : `https://ui-avatars.com/api/?name=${video.profiles?.username}`
            }
            alt={video.profiles?.username || "Unknown"}
            width={50}
            height={50}
            className="rounded-full"
            unoptimized
          />
          <div>
            <p className="font-bold">{video.profiles?.username}</p>
            <p className="text-gray-500 text-sm">
              Diposting pada {new Date(video.created_at).toLocaleDateString()}
            </p>
          </div>
        </Link>

        <h1 className="text-xl font-bold mt-4">{video.title}</h1>
        <p className="text-gray-600 text-sm">{video.description}</p>

        <div className="flex items-center gap-4 mt-3">
          <button
            onClick={() => handleLikeDislike("like")}
            className={`px-3 py-1 rounded flex items-center gap-1 ${
              userLikeType === "like"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            👍 {video.likes}
          </button>
          <button
            onClick={() => handleLikeDislike("dislike")}
            className={`px-3 py-1 rounded flex items-center gap-1 ${
              userLikeType === "dislike"
                ? "bg-red-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            👎 {video.dislikes}
          </button>
        </div>

        <hr className="my-6" />

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

      {/* ✅ Kolom Kanan: Rekomendasi (Kecil & Limit 5) */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold mb-3">Video Rekomendasi</h2>
        {recommended.map((v) => (
          <Link
            key={v.id}
            href={`/watch/${v.id}`}
            className="flex gap-3 hover:bg-gray-100 rounded p-2"
          >
            <div className="relative w-40 h-24 flex-shrink-0">
              <Image
                src={
                  v.thumbnail_url
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`
                    : "/default-thumbnail.jpg"
                }
                alt={v.title}
                fill
                className="object-cover rounded"
                unoptimized
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold line-clamp-2">{v.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <Image
                  src={
                    v.profiles?.avatar_url
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${v.profiles.avatar_url}`
                      : `https://ui-avatars.com/api/?name=${v.profiles?.username}`
                  }
                  alt={v.profiles?.username || "Unknown"}
                  width={18}
                  height={18}
                  className="rounded-full"
                  unoptimized
                />
                <p className="text-xs text-gray-500 truncate">
                  {v.profiles?.username}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

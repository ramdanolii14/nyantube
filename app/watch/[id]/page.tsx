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
  parent_id: string | null;
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
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [userLikeType, setUserLikeType] = useState<"like" | "dislike" | null>(null);

  // ✅ State untuk toggle view replies dan pagination reply
  const [visibleReplies, setVisibleReplies] = useState<{ [key: string]: boolean }>({});
  const [replyLimit, setReplyLimit] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchVideoAndComments = async () => {
      const { data: videoData } = await supabase
        .from("videos")
        .select("*, profiles(username, avatar_url)")
        .eq("id", id)
        .single();

      if (videoData) {
        setVideo({
          ...videoData,
          profiles: videoData.profiles || { username: "Unknown", avatar_url: null },
        });

        await supabase.rpc("increment_views", { video_id_input: id });

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

      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, user_id, content, created_at, parent_id, profiles(username, avatar_url)")
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
            profiles: v.profiles || { username: "Unknown", avatar_url: null },
          })) as Video[]
        );
      }
    };

    fetchVideoAndComments();
  }, [id, userId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !userId) return;

    await supabase.from("comments").insert([
      { video_id: id, user_id: userId, content: newComment.trim(), parent_id: null },
    ]);
    setNewComment("");
    refreshComments();
  };

  const handleReplyComment = async (parentId: string) => {
    if (!replyContent[parentId]?.trim() || !userId) return;

    await supabase.from("comments").insert([
      {
        video_id: id,
        user_id: userId,
        content: replyContent[parentId].trim(),
        parent_id: parentId,
      },
    ]);

    setReplyContent((prev) => ({ ...prev, [parentId]: "" }));
    refreshComments();
  };

  const refreshComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at, parent_id, profiles(username, avatar_url)")
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
      await supabase.from("video_likes").update({ type: type }).eq("id", existing.id);
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

        {/* ✅ Komentar dan Reply */}
        <div className="space-y-4">
          {comments
            .filter((c) => !c.parent_id)
            .map((c) => {
              const replies = comments.filter((r) => r.parent_id === c.id);
              const isVisible = visibleReplies[c.id];
              const limit = replyLimit[c.id] || 2; // default 2 reply dulu

              return (
                <div key={c.id} className="border-b pb-3">
                  <div className="flex items-start gap-3">
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
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{c.profiles.username}</p>
                      <p className="text-sm">{c.content}</p>
                      {userId && (
                        <button
                          onClick={() =>
                            setReplyContent((prev) => ({
                              ...prev,
                              [c.id]: prev[c.id] || "",
                            }))
                          }
                          className="text-xs text-blue-600 mt-1"
                        >
                          Balas
                        </button>
                      )}
                      {replyContent[c.id] !== undefined && (
                        <div className="mt-2">
                          <textarea
                            value={replyContent[c.id]}
                            onChange={(e) =>
                              setReplyContent((prev) => ({
                                ...prev,
                                [c.id]: e.target.value,
                              }))
                            }
                            placeholder="Tulis balasan..."
                            className="border p-2 rounded w-full mb-1 text-sm"
                          />
                          <button
                            onClick={() => handleReplyComment(c.id)}
                            className="bg-blue-600 text-white px-3 py-1 text-xs rounded"
                          >
                            Kirim Balasan
                          </button>
                        </div>
                      )}

                      {replies.length > 0 && (
                        <>
                          {!isVisible ? (
                            <button
                              onClick={() =>
                                setVisibleReplies((prev) => ({ ...prev, [c.id]: true }))
                              }
                              className="text-xs text-gray-500 mt-1"
                            >
                              Lihat {replies.length} balasan
                            </button>
                          ) : (
                            <div className="mt-2 space-y-2">
                              {replies.slice(0, limit).map((r) => (
                                <div key={r.id} className="flex items-start gap-2 ml-10">
                                  <Image
                                    src={
                                      r.profiles.avatar_url
                                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${r.profiles.avatar_url}`
                                        : `https://ui-avatars.com/api/?name=${r.profiles.username}`
                                    }
                                    alt={r.profiles.username}
                                    width={30}
                                    height={30}
                                    className="rounded-full"
                                    unoptimized
                                  />
                                  <div className="bg-gray-100 p-2 rounded">
                                    <p className="text-xs font-semibold">
                                      {r.profiles.username}
                                    </p>
                                    <p className="text-xs">{r.content}</p>
                                  </div>
                                </div>
                              ))}

                              {limit < replies.length && (
                                <button
                                  onClick={() =>
                                    setReplyLimit((prev) => ({
                                      ...prev,
                                      [c.id]: limit + 5,
                                    }))
                                  }
                                  className="text-xs text-gray-500 ml-10"
                                >
                                  Tampilkan 5 balasan lagi
                                </button>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ✅ Kolom Rekomendasi */}
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

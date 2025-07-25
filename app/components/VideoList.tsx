"use client";

import { useEffect, useState, useRef } from "react";
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
  replies?: Comment[];
}

export default function WatchPage() {
  const { id } = useParams() as { id: string };
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userLikeType, setUserLikeType] = useState<"like" | "dislike" | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [visibleReplies, setVisibleReplies] = useState<{ [key: string]: number }>({});
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [hasCountedView, setHasCountedView] = useState(false);

  // ✅ Ambil user login
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  // ✅ Ambil video, komentar, rekomendasi
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
        const mapped = (commentsData as unknown as any[]).map((c) => ({
          ...c,
          profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
        })) as Comment[];

        const topLevel = mapped.filter((c) => !c.parent_id);
        topLevel.forEach((c) => {
          c.replies = mapped.filter((r) => r.parent_id === c.id);
        });
        setComments(topLevel);
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

  // ✅ Hitung view setelah 25% & hanya 1x per hari
  useEffect(() => {
    if (!videoRef.current || !id || !userId || hasCountedView) return;
    const videoElement = videoRef.current;

    const handleTimeUpdate = async () => {
      if (!videoElement || hasCountedView) return;
      const progress = (videoElement.currentTime / videoElement.duration) * 100;
      if (progress >= 25) {
        const today = new Date().toISOString().split("T")[0];
        const key = `viewed_${id}_${userId}_${today}`;
        if (!localStorage.getItem(key)) {
          await supabase.rpc("increment_views", { video_id_input: id });
          localStorage.setItem(key, "true");
          setHasCountedView(true);
        }
      }
    };

    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    return () => {
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [id, userId, hasCountedView]);

  // ✅ Tambah Komentar
  const handleAddComment = async (parentId: string | null = null) => {
    if (!newComment.trim() || !userId) return;

    await supabase.from("comments").insert([
      { video_id: id, user_id: userId, content: newComment.trim(), parent_id: parentId },
    ]);
    setNewComment("");
    setReplyingTo(null);

    const { data: commentsData } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at, parent_id, profiles(username, avatar_url)")
      .eq("video_id", id)
      .order("created_at", { ascending: false });

    if (commentsData) {
      const mapped = (commentsData as unknown as any[]).map((c) => ({
        ...c,
        profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
      })) as Comment[];
      const topLevel = mapped.filter((c) => !c.parent_id);
      topLevel.forEach((c) => {
        c.replies = mapped.filter((r) => r.parent_id === c.id);
      });
      setComments(topLevel);
    }
  };

  // ✅ Edit Komentar
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    await supabase.from("comments").update({ content: editContent }).eq("id", commentId);
    setEditingComment(null);
    setEditContent("");
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, content: editContent }
          : { ...c, replies: c.replies?.map((r) => (r.id === commentId ? { ...r, content: editContent } : r)) }
      )
    );
  };

  // ✅ Hapus Komentar
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Yakin ingin menghapus komentar ini?")) return;
    await supabase.from("comments").delete().eq("id", commentId);
    setComments((prev) =>
      prev
        .filter((c) => c.id !== commentId)
        .map((c) => ({
          ...c,
          replies: c.replies?.filter((r) => r.id !== commentId),
        }))
    );
  };

  // ✅ Like & Dislike
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
      await supabase.from("video_likes").insert([{ video_id: id, user_id: userId, type }]);
      setUserLikeType(type);
    } else if (existing.type === type) {
      await supabase.from("video_likes").delete().eq("id", existing.id);
      setUserLikeType(null);
    } else {
      await supabase.from("video_likes").update({ type }).eq("id", existing.id);
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

    await supabase.from("videos").update({ likes: likeCount || 0, dislikes: dislikeCount || 0 }).eq("id", id);

    setVideo((prev) =>
      prev ? { ...prev, likes: likeCount || 0, dislikes: dislikeCount || 0 } : prev
    );
  };

  if (!video) return <p className="text-center mt-20">Loading video...</p>;

  return (
    <div className="max-w-6xl mx-auto pt-24 px-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50">
      {/* ✅ Kolom Kiri */}
      <div className="md:col-span-2">
        <div className="relative w-full rounded-md overflow-hidden bg-black" style={{ paddingTop: "56.25%" }}>
          <video
            ref={videoRef}
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
            controls
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        <Link href={`/profile/${video.user_id}`} className="flex items-center gap-3 mt-6 hover:opacity-80">
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
              userLikeType === "like" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            👍 {video.likes}
          </button>
          <button
            onClick={() => handleLikeDislike("dislike")}
            className={`px-3 py-1 rounded flex items-center gap-1 ${
              userLikeType === "dislike" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            👎 {video.dislikes}
          </button>
        </div>

        <hr className="my-6" />

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
              onClick={() => handleAddComment(null)}
              className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Kirim
            </button>
          </div>
        )}

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="space-y-2">
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
                <div className="bg-gray-100 p-2 rounded w-full">
                  <p className="text-sm font-semibold">{c.profiles.username}</p>
                  {editingComment === c.id ? (
                    <>
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="border p-1 rounded w-full mb-1"
                      />
                      <button
                        onClick={() => handleEditComment(c.id)}
                        className="text-blue-600 text-xs mr-2"
                      >
                        Simpan
                      </button>
                      <button
                        onClick={() => {
                          setEditingComment(null);
                          setEditContent("");
                        }}
                        className="text-gray-500 text-xs"
                      >
                        Batal
                      </button>
                    </>
                  ) : (
                    <p className="text-sm">{c.content}</p>
                  )}

                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <button
                      onClick={() =>
                        setReplyingTo(replyingTo === c.id ? null : c.id)
                      }
                      className="hover:underline"
                    >
                      Balas
                    </button>
                    {(c.user_id === userId || video?.user_id === userId) && (
                      <>
                        <button
                          onClick={() => {
                            setEditingComment(c.id);
                            setEditContent(c.content);
                          }}
                          className="hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="hover:underline text-red-500"
                        >
                          Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {replyingTo === c.id && (
                <div className="ml-12">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis balasan..."
                    className="border p-2 rounded w-full mb-2"
                  />
                  <button
                    onClick={() => handleAddComment(c.id)}
                    className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-sm"
                  >
                    Balas
                  </button>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="text-gray-500 text-xs ml-2"
                  >
                    Batal
                  </button>
                </div>
              )}

              {c.replies && c.replies.length > 0 && (
                <div className="ml-12 mt-2">
                  {!showReplies[c.id] ? (
                    <button
                      onClick={() =>
                        setShowReplies((prev) => ({ ...prev, [c.id]: true }))
                      }
                      className="text-blue-600 text-xs"
                    >
                      Lihat balasan ({c.replies.length})
                    </button>
                  ) : (
                    <>
                      {c.replies
                        .slice(0, visibleReplies[c.id] || 2)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="flex items-start gap-3 mt-2"
                          >
                            <Image
                              src={
                                r.profiles.avatar_url
                                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${r.profiles.avatar_url}`
                                  : `https://ui-avatars.com/api/?name=${r.profiles.username}`
                              }
                              alt={r.profiles.username}
                              width={35}
                              height={35}
                              className="rounded-full"
                              unoptimized
                            />
                            <div className="bg-gray-100 p-2 rounded w-full">
                              <p className="text-sm font-semibold">
                                {r.profiles.username}
                              </p>
                              {editingComment === r.id ? (
                                <>
                                  <textarea
                                    value={editContent}
                                    onChange={(e) =>
                                      setEditContent(e.target.value)
                                    }
                                    className="border p-1 rounded w-full mb-1"
                                  />
                                  <button
                                    onClick={() =>
                                      handleEditComment(r.id)
                                    }
                                    className="text-blue-600 text-xs mr-2"
                                  >
                                    Simpan
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingComment(null);
                                      setEditContent("");
                                    }}
                                    className="text-gray-500 text-xs"
                                  >
                                    Batal
                                  </button>
                                </>
                              ) : (
                                <p className="text-sm">{r.content}</p>
                              )}

                              {(r.user_id === userId ||
                                video?.user_id === userId) && (
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                  <button
                                    onClick={() => {
                                      setEditingComment(r.id);
                                      setEditContent(r.content);
                                    }}
                                    className="hover:underline"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDeleteComment(r.id)
                                    }
                                    className="hover:underline text-red-500"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      {c.replies.length >
                        (visibleReplies[c.id] || 2) && (
                        <button
                          onClick={() =>
                            setVisibleReplies((prev) => ({
                              ...prev,
                              [c.id]:
                                (visibleReplies[c.id] || 2) + 5,
                            }))
                          }
                          className="text-blue-600 text-xs mt-1"
                        >
                          Lihat lebih banyak
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Rekomendasi */}
      <div className="md:col-span-1 space-y-4">
        <h2 className="font-bold">Video Rekomendasi</h2>
        {recommended.map((v) => (
          <Link
            key={v.id}
            href={`/watch/${v.id}`}
            className="flex items-center gap-3 hover:opacity-80"
          >
            <Image
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
              alt={v.title}
              width={120}
              height={70}
              className="rounded"
              unoptimized
            />
            <div>
              <p className="text-sm font-semibold">{v.title}</p>
              <p className="text-xs text-gray-500">{v.profiles?.username}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

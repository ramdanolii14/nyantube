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
}

export default function WatchPage() {
  const { id } = useParams() as { id: string };
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyLoaded, setReplyLoaded] = useState<Record<string, boolean>>({});
  const [replyLimit, setReplyLimit] = useState<Record<string, number>>({});
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [userLikeType, setUserLikeType] = useState<"like" | "dislike" | null>(null);
  const [recommended, setRecommended] = useState<Video[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const viewTracked = useRef(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
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

    fetchData();
  }, [id, userId]);

  // ✅ Track View setelah 25% & 1x per hari
  useEffect(() => {
    const handleTimeUpdate = async () => {
      if (!videoRef.current || !video || !userId || viewTracked.current) return;

      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;

      if (duration && currentTime >= duration * 0.25) {
        const today = new Date().toISOString().split("T")[0];

        const { data: existingView } = await supabase
          .from("video_views")
          .select("id, viewed_at")
          .eq("video_id", video.id)
          .eq("user_id", userId)
          .maybeSingle();

        if (!existingView || existingView.viewed_at.split("T")[0] !== today) {
          await supabase.from("video_views").upsert({
            video_id: video.id,
            user_id: userId,
            viewed_at: new Date().toISOString(),
          });
          await supabase.rpc("increment_views", { video_id_input: video.id });
        }

        viewTracked.current = true;
      }
    };

    const vid = videoRef.current;
    vid?.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      vid?.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [video, userId]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !userId) return;
    await supabase.from("comments").insert([{ video_id: id, user_id: userId, content: newComment.trim() }]);
    setNewComment("");
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

  const handleReply = async (parentId: string) => {
    if (!replyText[parentId]?.trim() || !userId) return;
    await supabase.from("comments").insert([{ video_id: id, user_id: userId, content: replyText[parentId], parent_id: parentId }]);
    setReplyText((prev) => ({ ...prev, [parentId]: "" }));
    loadReplies(parentId, true);
  };

  const loadReplies = async (parentId: string, refresh = false) => {
    const limit = refresh ? 5 : (replyLimit[parentId] || 5) + 5;
    const { data } = await supabase
      .from("comments")
      .select("id, user_id, content, created_at, parent_id, profiles(username, avatar_url)")
      .eq("video_id", id)
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true })
      .limit(limit);
    if (data) {
      const mapped = data.map((c: any) => ({
        ...c,
        profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
      })) as Comment[];
      setComments((prev) => {
        const others = prev.filter((c) => c.parent_id !== parentId);
        return [...others, ...mapped, ...prev.filter((c) => c.id === parentId)];
      });
      setReplyLoaded((prev) => ({ ...prev, [parentId]: true }));
      setReplyLimit((prev) => ({ ...prev, [parentId]: limit }));
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editingText.trim()) return;
    await supabase.from("comments").update({ content: editingText }).eq("id", commentId);
    setEditingCommentId(null);
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content: editingText } : c))
    );
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Yakin ingin menghapus komentar ini?")) return;
    await supabase.from("comments").delete().eq("id", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
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
    setVideo((prev) => (prev ? { ...prev, likes: likeCount || 0, dislikes: dislikeCount || 0 } : prev));
  };

  if (!video) return <p className="text-center mt-20">Loading video...</p>;

  return (
    <div className="max-w-6xl mx-auto pt-24 px-4 grid grid-cols-1 md:grid-cols-3 gap-6 bg-gray-50">
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
          {comments
            .filter((c) => !c.parent_id)
            .map((c) => (
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
                    {editingCommentId === c.id ? (
                      <div className="space-y-1">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="border p-1 rounded w-full text-sm"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(c.id)}
                            className="text-xs text-blue-600"
                          >
                            Simpan
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="text-xs text-gray-500"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{c.content}</p>
                    )}

                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() =>
                          setReplyOpen((prev) => ({
                            ...prev,
                            [c.id]: !prev[c.id],
                          }))
                        }
                        className="text-xs text-blue-600"
                      >
                        Balas
                      </button>
                      {userId === c.user_id && (
                        <>
                          <button
                            onClick={() => {
                              setEditingCommentId(c.id);
                              setEditingText(c.content);
                            }}
                            className="text-xs text-green-600"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="text-xs text-red-600"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                      {!replyLoaded[c.id] && (
                        <button
                          onClick={() => loadReplies(c.id, true)}
                          className="text-xs text-gray-500"
                        >
                          View Reply
                        </button>
                      )}
                    </div>

                    {replyOpen[c.id] && (
                      <div className="mt-2">
                        <textarea
                          value={replyText[c.id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [c.id]: e.target.value,
                            }))
                          }
                          placeholder="Tulis balasan..."
                          className="border p-1 rounded w-full text-sm"
                        />
                        <button
                          onClick={() => handleReply(c.id)}
                          className="text-xs text-blue-600 mt-1"
                        >
                          Kirim Balasan
                        </button>
                      </div>
                    )}

                    {replyLoaded[c.id] &&
                      comments
                        .filter((r) => r.parent_id === c.id)
                        .map((r) => (
                          <div
                            key={r.id}
                            className="flex items-start gap-2 mt-2 ml-8"
                          >
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
                            <div className="bg-gray-100 p-2 rounded w-full">
                              <p className="text-xs font-semibold">
                                {r.profiles.username}
                              </p>
                              {editingCommentId === r.id ? (
                                <div className="space-y-1">
                                  <textarea
                                    value={editingText}
                                    onChange={(e) =>
                                      setEditingText(e.target.value)
                                    }
                                    className="border p-1 rounded w-full text-xs"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEdit(r.id)}
                                      className="text-xs text-blue-600"
                                    >
                                      Simpan
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingCommentId(null)
                                      }
                                      className="text-xs text-gray-500"
                                    >
                                      Batal
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs">{r.content}</p>
                              )}
                              {userId === r.user_id && (
                                <div className="flex gap-2 mt-1">
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(r.id);
                                      setEditingText(r.content);
                                    }}
                                    className="text-xs text-green-600"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(r.id)}
                                    className="text-xs text-red-600"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                    {replyLoaded[c.id] &&
                      (replyLimit[c.id] || 5) <
                        comments.filter((r) => r.parent_id === c.id).length && (
                        <button
                          onClick={() => loadReplies(c.id)}
                          className="text-xs text-gray-500 mt-1 ml-8"
                        >
                          View More
                        </button>
                      )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-3">Rekomendasi</h3>
        <div className="space-y-3">
          {recommended.map((v) => (
            <Link
              key={v.id}
              href={`/watch/${v.id}`}
              className="flex gap-3 hover:bg-gray-100 p-2 rounded"
            >
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
                alt={v.title}
                width={120}
                height={80}
                className="rounded"
                unoptimized
              />
              <div>
                <p className="font-semibold text-sm">{v.title}</p>
                <p className="text-xs text-gray-500">
                  {v.profiles?.username || "Unknown"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

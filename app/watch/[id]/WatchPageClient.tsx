"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { timeAgo } from "@/lib/timeAgo";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  channel_name?: string;
  is_verified?: boolean;
  is_mod?: boolean;
  is_bughunter?: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  profiles: Profile;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id?: string | null;
  edited?: boolean;
  profiles: Profile;
}

export default function WatchPageClient({ id }: { id: string }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  const [commentError, setCommentError] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");

  const getAvatarUrl = (avatar_url: string | null, name: string) =>
    avatar_url
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatar_url}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;

  useEffect(() => {
    if (commentError) {
      setFadeOut(false);
      const fadeTimer = setTimeout(() => setFadeOut(true), 4500);
      const removeTimer = setTimeout(() => setCommentError(null), 5000);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [commentError]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id || null;
      setCurrentUserId(userId);

      if (userId) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, username, avatar_url, channel_name, is_verified, is_mod, is_bughunter")
          .eq("id", userId)
          .single();
        setCurrentUserProfile(profileData || null);
      }

      const { data: videoData } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, channel_name, is_verified, is_mod, is_bughunter)")
        .eq("id", id)
        .single();

      if (videoData) {
        setVideo(videoData);
        await supabase.from("videos").update({ views: (videoData.views || 0) + 1 }).eq("id", id);
      }

      const { data: relatedData } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, channel_name, is_verified, is_mod, is_bughunter)")
        .neq("id", id)
        .limit(10);
      setRelatedVideos(relatedData || []);

      const { data: commentData } = await supabase
        .from("comments")
        .select("*, profiles(id, username, avatar_url, channel_name, created_at, is_verified, is_mod, is_bughunter)")
        .eq("video_id", id)
        .order("created_at", { ascending: true });
      setComments(commentData || []);

      const { data: likesData } = await supabase
        .from("video_likes")
        .select("type, user_id")
        .eq("video_id", id);
      setLikes(likesData?.filter((v) => v.type === "like").length || 0);
      setDislikes(likesData?.filter((v) => v.type === "dislike").length || 0);
      const current = likesData?.find((v) => v.user_id === userId);
      setUserVote(current ? (current.type as "like" | "dislike") : null);
    };

    fetchData();
  }, [id]);

  const refreshComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(id, username, avatar_url, channel_name, is_verified, is_mod, is_bughunter)")
      .eq("video_id", id)
      .order("created_at", { ascending: true });
    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!currentUserId || !newComment.trim()) return;

    if (newComment.length > 110) {
      setCommentError("Komentar tidak boleh lebih dari 110 karakter.");
      return;
    }

    await supabase.from("comments").insert({
      video_id: id,
      content: newComment,
      user_id: currentUserId,
    });
    setNewComment("");
    refreshComments();
  };

  const handleReplySubmit = async (e: React.FormEvent, parentId: string) => {
    e.preventDefault();
    if (!currentUserId || !replyContent.trim()) return;

    await supabase.from("comments").insert({
      video_id: id,
      content: replyContent,
      user_id: currentUserId,
      parent_id: parentId,
    });

    setReplyContent("");
    setReplyingTo(null);
    refreshComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setConfirmDeleteId(null);
    refreshComments();
  };

  const handleVote = async (type: "like" | "dislike") => {
    if (!currentUserId) return;
    if (userVote === type) {
      await supabase.from("video_likes").delete().eq("video_id", id).eq("user_id", currentUserId);
      if (type === "like") setLikes((p) => p - 1);
      else setDislikes((p) => p - 1);
      setUserVote(null);
    } else {
      await supabase.from("video_likes").upsert({ video_id: id, user_id: currentUserId, type });
      if (type === "like") {
        if (userVote === "dislike") setDislikes((p) => p - 1);
        setLikes((p) => p + 1);
      } else {
        if (userVote === "like") setLikes((p) => p - 1);
        setDislikes((p) => p + 1);
      }
      setUserVote(type);
    }
  };

  if (!video) {
    return <p className="text-center mt-10">Loading... Jika stuck langsung refresh aja.</p>;
  }

  return (
    <div className="w-full bg-white-50 mt-24 pb-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-6">
        {/* Video Section */}
        <div className="flex-1 max-w-3xl">
          <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
            <video
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
              controls
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-xl font-bold mt-4 mb-2">{video.title}</h1>

          {/* Channel Info + Like/Dislike */}
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/${video.profiles?.username ?? "#"}`}>
              <Image
                src={getAvatarUrl(video.profiles?.avatar_url, video.profiles?.channel_name || video.profiles?.username || "Unknown")}
                alt="avatar"
                width={40}
                height={40}
                className="rounded-full w-10 h-10 object-cover"
              />
            </Link>
            <div className="flex-1">
              <Link href={`/${video.profiles?.username ?? "#"}`} className="font-semibold hover:underline flex items-center gap-1">
                {video.profiles?.channel_name || video.profiles?.username || "Unknown Channel"}
                {video.profiles?.is_verified && <Image src="/verified.svg" alt="verified" width={14} height={14} />}
                {video.profiles?.is_mod && <Image src="/mod.svg" alt="mod" width={14} height={14} />}
                {video.profiles?.is_bughunter && <Image src="/bughunter.svg" alt="bughunter" width={14} height={14} />}
              </Link>
              <p className="text-sm text-gray-500">{video.views} views • {timeAgo(video.created_at)}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote("like")}
                className={`flex items-center gap-1 px-2 py-1 rounded ${userVote === "like" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"}`}
              >
                👍 {likes}
              </button>
              <button
                onClick={() => handleVote("dislike")}
                className={`flex items-center gap-1 px-2 py-1 rounded ${userVote === "dislike" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}
              >
                👎 {dislikes}
              </button>
            </div>
          </div>

          {/* Description */}
          <p className="mb-6 text-sm text-gray-800 break-words whitespace-pre-line">{video.description}</p>

          {/* Comments Section */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Komentar</h3>

            {/* Form komentar utama */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddComment();
              }}
              className="mb-4 flex gap-3"
            >
              <input
                type="text"
                placeholder="Tulis komentar..."
                className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring focus:ring-blue-300"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={110}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700"
              >
                Kirim
              </button>
              <p className="text-xs text-gray-500 text-right">{newComment.length}/110</p>
            </form>

            {/* Daftar komentar */}
            <div className="flex flex-col gap-4">
              {comments
                .filter((c) => !c.parent_id)
                .slice()
                .reverse()
                .map((c) => {
                  const isOwner = c.user_id === currentUserId;
                  const canDelete =
                    isOwner || video?.profiles?.id === currentUserId || currentUserProfile?.is_mod;

                  const replies = comments
                    .filter((r) => r.parent_id === c.id)
                    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

                  return (
                    <div key={c.id} className="bg-white shadow-md rounded-2xl p-4 flex flex-col gap-3">
                      {/* Header komentar */}
                      <div className="flex items-start gap-3">
                        <Image
                          src={getAvatarUrl(c.profiles?.avatar_url, c.profiles?.channel_name || "User")}
                          alt={c.profiles?.channel_name || "User"}
                          width={42}
                          height={42}
                          className="object-round w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{c.profiles?.channel_name || "User"}</span>
                            <span className="text-xs text-gray-500">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-800">{c.content}</p>

                          {/* Aksi komentar */}
                          <div className="flex items-center gap-4 mt-2">
                            <button
                              onClick={() => setReplyingTo(c.id)}
                              className="text-xs font-medium text-blue-600 hover:underline"
                            >
                              Reply
                            </button>

                            {canDelete && (
                              <button
                                onClick={async () => {
                                  const confirmed = window.confirm(
                                    "Apakah kamu yakin ingin menghapus komentar ini?"
                                  );
                                  if (confirmed) await handleDeleteComment(c.id);
                                }}
                                className="text-xs font-medium text-red-500 hover:underline"
                              >
                                Hapus
                              </button>
                            )}
                          </div>

                          {/* Form reply */}
                          {replyingTo === c.id && (
                            <form
                              onSubmit={(e) => handleReplySubmit(e, c.id)}
                              className="mt-3 flex gap-2"
                            >
                              <input
                                type="text"
                                placeholder="Tulis balasan..."
                                className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring focus:ring-red-300"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                maxLength={110}
                              />
                              <button
                                type="submit"
                                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700"
                              >
                                Kirim
                              </button>
                              <p className="text-xs text-gray-500 text-right">{newComment.length}/110</p>
                            </form>
                          )}

                          {/* Daftar reply */}
                          {replies.length > 0 && (
                            <div className="mt-4 flex flex-col gap-3">
                              {replies.map((r) => {
                                const isReplyOwner = r.user_id === currentUserId;
                                const canDeleteReply =
                                  isReplyOwner || video?.profiles?.id === currentUserId || currentUserProfile?.is_mod;

                                return (
                                  <div
                                    key={r.id}
                                    className="ml-8 bg-gray-50 border border-gray-200 shadow-sm rounded-xl p-3 flex gap-3"
                                  >
                                    <Image
                                      src={getAvatarUrl(r.profiles?.avatar_url, r.profiles?.channel_name || "User")}
                                      alt={r.profiles?.channel_name || "User"}
                                      width={32}
                                      height={32}
                                      className="object-cover w-8 h-8 rounded-full"
                                    />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold">{r.profiles?.channel_name || "User"}</span>
                                        <span className="text-xs text-gray-500">{timeAgo(r.created_at)}</span>
                                      </div>
                                      <p className="text-sm text-gray-700">{r.content}</p>
                                      {canDeleteReply && (
                                        <button
                                          onClick={async () => {
                                            const confirmed = window.confirm(
                                              "Apakah kamu yakin ingin menghapus balasan ini?"
                                            );
                                            if (confirmed) await handleDeleteComment(r.id);
                                          }}
                                          className="text-xs text-red-500 hover:underline mt-1"
                                        >
                                          Hapus
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        {/* Related Videos */}
        <div className="w-full md:w-72">
          <h2 className="font-semibold mb-3">Related Videos</h2>
          {relatedVideos.map((v) => (
            <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-2 mb-3 hover:bg-gray-100 p-1 rounded">
              <div className="relative w-32 h-20 bg-gray-200 rounded-md overflow-hidden">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
                  alt={v.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold line-clamp-2">{v.title}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {v.profiles?.channel_name || "[Unknown Channel]"}
                  {v.profiles?.is_verified && <Image src="/verified.svg" alt="verified" title="AKUN TERVERIFIKASI" width={10} height={10} />}
                  {v.profiles?.is_mod && <Image src="/mod.svg" alt="mod" title="TERVERIFIKASI ADMIN" width={10} height={10} />}
                  {v.profiles?.is_bughunter && <Image src="/bughunter.svg" alt="bughunter" title="TERVERIFIKASI BUGHUNTER" width={10} height={10} />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

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

  const getAvatarUrl = (avatar_url: string | null, name: string) => {
    return avatar_url
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatar_url}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`;
  };

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
        <div className="flex-1 max-w-3xl">
          {/* Video Player */}
          <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-video">
            <video
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
              controls
              className="w-full h-full object-contain"
            />
          </div>

          <h1 className="text-xl font-bold mt-4 mb-2">{video.title}</h1>

          {/* Channel Info */}
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

            {/* Like/Dislike */}
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

          {/* Comments */}
          <div className="mt-6 break-words">
            <h2 className="font-semibold mb-3">Comments ({comments.length})</h2>

            {/* Add comment */}
            {currentUserId && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddComment();
                }}
                className="flex items-start gap-3 mb-6"
              >
                <Image
                  src={getAvatarUrl(currentUserProfile?.avatar_url || null, currentUserProfile?.username || "Anon")}
                  alt="avatar"
                  width={40}
                  height={40}
                  className="rounded-full w-10 h-10 object-cover"
                />
                <div className="flex-1">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis komentar..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring focus:ring-blue-400"
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">{newComment.length}/110</span>
                    <button type="submit" className="px-4 py-1 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700">
                      Kirim
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* List comments */}
            <div className="flex flex-col gap-4">
              {comments.filter((c) => !c.parent_id).map((c) => {
                const canDelete = c.user_id === currentUserId || video?.profiles?.id === currentUserId || currentUserProfile?.is_mod;
                return (
                  <div key={c.id} className="border-b pb-3">
                    <div className="flex items-start gap-3">
                      <Image
                        src={getAvatarUrl(c.profiles?.avatar_url, c.profiles?.username || "Anon")}
                        alt="avatar"
                        width={40}
                        height={40}
                        className="rounded-full w-10 h-10 object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{c.profiles?.username || "Anonim"}</span>
                          <span className="text-xs text-gray-500">{timeAgo(c.created_at)}</span>
                        </div>
                        <p className="text-sm mt-1">{c.content}</p>
                        <div className="flex gap-3 mt-2 text-xs text-gray-500">
                          <button onClick={() => setReplyingTo(c.id)} className="hover:text-blue-600">Reply</button>
                          {canDelete && <button onClick={() => handleDeleteComment(c.id)} className="hover:text-red-600">Hapus</button>}
                        </div>

                        {/* Reply form */}
                        {replyingTo === c.id && (
                          <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="flex items-start gap-2 mt-3">
                            <Image
                              src={getAvatarUrl(currentUserProfile?.avatar_url || null, currentUserProfile?.username || "Anon")}
                              alt="avatar"
                              width={32}
                              height={32}
                              className="rounded-full w-8 h-8 object-cover"
                            />
                            <div className="flex-1">
                              <textarea
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                placeholder="Tulis balasan..."
                                className="w-full border border-gray-300 rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring focus:ring-blue-400"
                              />
                              <div className="flex justify-end mt-2">
                                <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded-lg text-xs hover:bg-blue-600">Balas</button>
                              </div>
                            </div>
                          </form>
                        )}

                        {/* Replies */}
                        <div className="mt-3 ml-8 space-y-3">
                          {comments.filter((r) => r.parent_id === c.id).map((reply) => {
                            const canDeleteReply = reply.user_id === currentUserId || video?.profiles?.id === currentUserId || currentUserProfile?.is_mod;
                            return (
                              <div key={reply.id} className="flex items-start gap-2">
                                <Image
                                  src={getAvatarUrl(reply.profiles?.avatar_url, reply.profiles?.username || "Anon")}
                                  alt="avatar"
                                  width={32}
                                  height={32}
                                  className="rounded-full w-8 h-8 object-cover"
                                />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm">{reply.profiles?.username || "Anonim"}</span>
                                    <span className="text-xs text-gray-500">{timeAgo(reply.created_at)}</span>
                                  </div>
                                  <p className="text-sm">{reply.content}</p>
                                  {canDeleteReply && (
                                    <button onClick={() => handleDeleteComment(reply.id)} className="text-xs text-red-500 hover:underline">
                                      Hapus
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                  {v.profiles?.channel_name || v.profiles?.username || "[Unknown Channel]"}
                  {v.profiles?.is_verified && <Image src="/verified.svg" alt="verified" title="AKUN TERVERIFIKASI" width={10} height={10} />}
                  {v.profiles?.is_mod && <Image src="/mod.svg" alt="mod" title="TERVERIFIKASI ADMIN" width={10} height={10} />}
                  {v.profiles?.is_bughunter && <Image src="/bughunter.svg" alt="bughunter" title="TERVERIFIKASI BUGHUNTER" width={10} height={10} />}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {confirmDeleteId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg w-80">
            <h3 className="text-lg font-semibold mb-4">Confirm Deletion</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this comment?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="bg-gray-300 text-gray-800 px-4 py-2 rounded w-20 text-center">
                Cancel
              </button>
              <button onClick={() => handleDeleteComment(confirmDeleteId)} className="bg-red-500 text-white px-4 py-2 rounded w-20 text-center">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

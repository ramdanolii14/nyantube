"use client";

import { useEffect, useState, useRef } from "react";
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
  edited?: boolean;
  profiles: Profile;
}

export default function WatchPageClient({ id }: { id: string }) {
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editComment, setEditComment] = useState<{ id: string; content: string } | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<Profile | null>(null);

  const [commentError, setCommentError] = useState<string | null>(null);
  const [fadeOut, setFadeOut] = useState(false);

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
        .order("created_at", { ascending: false })
        .limit(50);
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
      .order("created_at", { ascending: false });
    setComments(data || []);
  };

  const handleAddComment = async () => {
    if (!currentUserId || !newComment.trim()) return;

    if (newComment.length > 110) {
      setCommentError("Komentar tidak boleh lebih dari 110 karakter.");
      return;
    }

    // Tentukan limit berdasarkan role
    let maxComments: number | null = 2; // default user biasa
    if (currentUserProfile?.is_verified) maxComments = 20;
    if (currentUserProfile?.is_mod) maxComments = null; // unlimited

    if (maxComments !== null) {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", currentUserId)
        .gte("created_at", oneHourAgo);

      if ((count ?? 0) >= maxComments) {
        setCommentError(`You can only post ${maxComments} comments per hour.`);
        return;
      }
    }

    setCommentError(null);
    await supabase.from("comments").insert({
      video_id: id,
      content: newComment,
      user_id: currentUserId,
    });
    setNewComment("");
    refreshComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setConfirmDeleteId(null);
    refreshComments();
  };

  const handleEditComment = async () => {
    if (!editComment || !editComment.content.trim()) return;
    await supabase
      .from("comments")
      .update({ content: editComment.content, edited: true })
      .eq("id", editComment.id);
    setEditComment(null);
    refreshComments();
  };

  const handleVote = async (type: "like" | "dislike") => {
    if (!currentUserId) return;
    if (userVote === type) {
      await supabase
        .from("video_likes")
        .delete()
        .eq("video_id", id)
        .eq("user_id", currentUserId);
      if (type === "like") setLikes((p) => p - 1);
      else setDislikes((p) => p - 1);
      setUserVote(null);
    } else {
      await supabase
        .from("video_likes")
        .upsert({ video_id: id, user_id: currentUserId, type });
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
    return <p className="text-center mt-10">Loading...</p>;
  

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
            {video.profiles ? (
              <>
                <Link href={`/${video.profiles?.username ?? "#"}`}>
                  <Image
                    src={getAvatarUrl(
                      video.profiles?.avatar_url,
                      video.profiles?.channel_name || video.profiles?.username || "Unknown"
                    )}
                    alt="avatar"
                    width={40}
                    height={40}
                    className="rounded-full w-10 h-10 object-cover"
                  />
                </Link>
                <div className="flex-1">
                  <Link
                    href={`/${video.profiles?.username ?? "#"}`}
                    className="font-semibold hover:underline flex items-center gap-1"
                  >
                    {video.profiles?.channel_name || video.profiles?.username || "Unknown Channel"}
                    {video.profiles?.is_verified && <Image src="/verified.svg" alt="verified" width={14} height={14} />}
                    {video.profiles?.is_mod && <Image src="/mod.svg" alt="mod" width={14} height={14} />}
                    {video.profiles?.is_bughunter && <Image src="/bughunter.svg" alt="bughunter" width={14} height={14} />}
                  </Link>
                  <p className="text-sm text-gray-500">
                    {video.views} views • {timeAgo(video.created_at)}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-sm text-gray-500">[Unknown Channel]</div>
            )}

            {/* Like/Dislike */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote("like")}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  userVote === "like" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-600"
                }`}
              >
                👍 {likes}
              </button>
              <button
                onClick={() => handleVote("dislike")}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  userVote === "dislike" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"
                }`}
              >
                👎 {dislikes}
              </button>
            </div>
          </div>

          {/* Video Description */}
          <p className="mb-6 text-sm text-gray-800 break-words whitespace-pre-line">{video.description}</p>

          {/* Comments */}
          <div className="mt-6 break-words">
            <h2 className="font-semibold mb-3 break-words">Comments ({comments.length})</h2>

            <div className="flex flex-col gap-1 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => {
                    if (e.target.value.length <= 110) {
                      setNewComment(e.target.value);
                    }
                  }}
                  placeholder="Add a comment..."
                  className="flex-1 border rounded px-3 py-2"
                />
                <button onClick={handleAddComment} className="bg-red-500 text-white px-4 py-2 rounded">
                  Post
                </button>
              </div>

              {/* Counter & Role Info */}
              <div className="text-sm text-gray-500 text-right mt-1">{newComment.length}/110</div>
              {currentUserProfile?.is_mod ? (
                <div className="text-xs text-purple-600">🛡 Moderator — tidak ada batas komentar per jam.</div>
              ) : currentUserProfile?.is_verified ? (
                <div className="text-xs text-green-600">✔ Akun terverifikasi — batas 20 komentar per jam.</div>
              ) : (
                <div className="text-xs text-green-600">Bukan Akun Verified - dibatasi 2 komentar per jam.</div>
              )}

              {commentError && (
                <div
                  className={`flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded transition-all duration-500 ${
                    fadeOut ? "opacity-0 -translate-y-1" : "opacity-100 translate-y-0"
                  }`}
                >
                  <span className="text-sm">{commentError}</span>
                </div>
              )}
            </div>

            {/* Comment List */}
              <div className="flex flex-col gap-3">
                {comments.map((c) => {
                  const isOwner = c.user_id === currentUserId;
                  const canDelete =
                    isOwner || video?.profiles?.id === currentUserId || currentUserProfile?.is_mod;
              
                  return (
                    <div key={c.id} className="mb-3">
                      <div className="flex gap-2 p-3 border rounded-lg bg-white shadow-sm">
                        {c.profiles ? (
                          <>
                            <Link href={`/${c.profiles?.username ?? "#"}`}>
                              <Image
                                src={getAvatarUrl(
                                  c.profiles?.avatar_url,
                                  c.profiles?.channel_name ||
                                    c.profiles?.username ||
                                    "Unknown"
                                )}
                                alt="avatar"
                                width={40}
                                height={40}
                                className="rounded-full w-10 h-10 object-cover"
                              />
                            </Link>
                            <div className="flex-1">
                              <Link
                                href={`/${c.profiles?.username ?? "#"}`}
                                className="font-semibold hover:underline flex items-center gap-1"
                              >
                                {c.profiles?.channel_name ||
                                  c.profiles?.username ||
                                  "Unknown User"}
                                {c.profiles?.is_verified && (
                                  <Image
                                    src="/verified.svg"
                                    alt="verified"
                                    width={12}
                                    height={12}
                                    title="AKUN TERVERIVIKASI"
                                  />
                                )}
                                {c.profiles?.is_mod && (
                                  <Image
                                    src="/mod.svg"
                                    alt="mod"
                                    width={12}
                                    height={12}
                                    title="TERVERIFIKASI MOD"
                                  />
                                )}
                                {c.profiles?.is_bughunter && (
                                  <Image
                                    src="/bughunter.svg"
                                    alt="bughunter"
                                    width={12}
                                    height={12}
                                    title="TERVERIFIKASI BUGHUNTER"
                                  />
                                )}
                                <span className="text-gray-500">
                                  · {timeAgo(c.created_at)}
                                </span>
                              </Link>
              
                              {c.edited && (
                                <span className="text-xs text-gray-500 ml-1">[edited]</span>
                              )}
              
                              {editComment?.id === c.id ? (
                                <div className="flex gap-2 mt-1">
                                  <input
                                    type="text"
                                    value={editComment.content}
                                    onChange={(e) =>
                                      setEditComment({
                                        ...editComment,
                                        content: e.target.value,
                                      })
                                    }
                                    className="border px-2 py-1 rounded text-sm w-full"
                                  />
                                  <button
                                    onClick={handleEditComment}
                                    className="text-blue-500 text-sm"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditComment(null)}
                                    className="text-gray-500 text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <p className="mt-1 text-sm break-words whitespace-pre-line">
                                  {c.content}
                                </p>
                              )}
              
                              {canDelete && (
                                <div className="flex gap-3 text-xs text-gray-500 mt-2">
                                  <button
                                    onClick={() => setConfirmDeleteId(c.id)}
                                    className="bg-red-500 text-white px-3 py-1 rounded w-20 text-center"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-500">[Deleted User]</div>
                        )}
                      </div>
                    </div>
                  );
                })}
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

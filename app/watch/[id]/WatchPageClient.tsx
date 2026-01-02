/**
 * File: src/components/WatchPageClient.tsx
 * Update: Loading text centered, Skeleton UI, Lucide Icons, Disable Context Menu on Video
 */

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { timeAgo } from "@/lib/timeAgo";
import Image from "next/image";
import Link from "next/link";
import { ThumbsUp, ThumbsDown, Share2 } from "lucide-react";

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

// Komponen Skeleton untuk Loading yang lebih rapi
const WatchSkeleton = () => (
  <div className="w-full bg-white-50 mt-24 pb-10 animate-pulse">
    <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-6">
      <div className="flex-1 max-w-3xl">
        <div className="w-full aspect-video bg-gray-200 rounded-lg"></div>
        <div className="h-6 bg-gray-200 rounded w-3/4 mt-4"></div>
        <div className="flex items-center gap-3 mt-4">
          <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/6 mt-2"></div>
          </div>
        </div>
      </div>
      <div className="w-full md:w-72">
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-2 mb-3">
            <div className="w-32 h-20 bg-gray-200 rounded-md"></div>
            <div className="flex-1 h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentComments } = await supabase
      .from("comments")
      .select("id")
      .eq("user_id", currentUserId)
      .gte("created_at", oneHourAgo);
  
    let limit = 2; 
    if (currentUserProfile?.is_verified) limit = 20;
    if (currentUserProfile?.is_mod) limit = Infinity;
  
    if ((recentComments?.length || 0) >= limit) {
      setCommentError(`Batas komentar per jam tercapai (${limit} komentar).`);
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

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link disalin ke clipboard!");
  };

  // State loading ditengah & Skeleton
  if (!video) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white">
        <WatchSkeleton />
        <p className="text-gray-500 font-medium animate-bounce mt-4">Loading... Jika stuck langsung refresh aja.</p>
      </div>
    );
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
              playsInline
              onContextMenu={(e) => e.preventDefault()} // Menonaktifkan Klik Kanan
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
              <p className="text-sm text-gray-500">{video.views.toLocaleString()} views • {timeAgo(video.created_at)}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleVote("like")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${userVote === "like" ? "bg-blue-100 text-blue-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
              >
                <ThumbsUp size={18} fill={userVote === "like" ? "currentColor" : "none"} /> {likes}
              </button>
              <button
                onClick={() => handleVote("dislike")}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${userVote === "dislike" ? "bg-red-100 text-red-600" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
              >
                <ThumbsDown size={18} fill={userVote === "dislike" ? "currentColor" : "none"} /> {dislikes}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition"
              >
                <Share2 size={18} /> Share
              </button>
            </div>
          </div>

          <p className="mb-6 text-sm text-gray-800 break-words whitespace-pre-line">{video.description}</p>

          {/* Comments Section */}
          <div className="mt-6">
            {commentError && (
              <div className={`mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
                {commentError}
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-4">Komentar</h3>

            <form onSubmit={(e) => { e.preventDefault(); handleAddComment(); }} className="mb-6 flex flex-col gap-2">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Tulis komentar..."
                  className="flex-1 px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring focus:ring-blue-300"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  maxLength={110}
                />
                <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-xl text-sm font-bold hover:bg-red-700">
                  Kirim
                </button>
              </div>
              <p className="text-[10px] text-gray-400 text-right">{newComment.length}/110</p>
            </form>

            <div className="flex flex-col gap-4">
              {comments
                .filter((c) => !c.parent_id)
                .slice()
                .reverse()
                .map((c) => {
                  const isOwner = c.user_id === currentUserId;
                  const canDelete = isOwner || video?.profiles?.id === currentUserId || currentUserProfile?.is_mod;
                  const replies = comments.filter((r) => r.parent_id === c.id);

                  return (
                    <div key={c.id} className="bg-white shadow-sm border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-start gap-3">
                        <Link href={`/${c.profiles?.username ?? "#"}`}>
                          <Image
                            src={getAvatarUrl(c.profiles?.avatar_url, c.profiles?.channel_name || "User")}
                            alt="User"
                            width={40}
                            height={40}
                            className="rounded-full object-cover"
                          />
                        </Link>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Link href={`/${c.profiles?.username ?? "#"}`} className="font-bold text-sm hover:underline">
                              {c.profiles?.channel_name || "User"}
                            </Link>
                            <span className="text-[10px] text-gray-400">{timeAgo(c.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-800">{c.content}</p>
                          <div className="flex items-center gap-4 mt-2">
                            <button onClick={() => setReplyingTo(c.id)} className="text-xs font-bold text-gray-500 hover:text-blue-600">Reply</button>
                            {canDelete && (
                              <button onClick={() => { if(window.confirm("Hapus?")) handleDeleteComment(c.id) }} className="text-xs font-bold text-red-400 hover:text-red-600">Hapus</button>
                            )}
                          </div>

                          {replyingTo === c.id && (
                            <form onSubmit={(e) => handleReplySubmit(e, c.id)} className="mt-3 flex gap-2">
                              <input
                                type="text"
                                className="flex-1 px-3 py-1.5 border rounded-lg text-sm"
                                value={replyContent}
                                onChange={(e) => setReplyContent(e.target.value)}
                                maxLength={110}
                                autoFocus
                              />
                              <button type="submit" className="px-3 py-1 bg-gray-800 text-white rounded-lg text-xs">Kirim</button>
                            </form>
                          )}

                          {replies.map((r) => (
                            <div key={r.id} className="mt-3 pl-4 border-l-2 border-gray-100 flex gap-2">
                               <Image
                                src={getAvatarUrl(r.profiles?.avatar_url, r.profiles?.channel_name || "User")}
                                alt="User" width={24} height={24} className="rounded-full h-6 w-6"
                              />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs">{r.profiles?.channel_name}</span>
                                  <span className="text-[10px] text-gray-400">{timeAgo(r.created_at)}</span>
                                </div>
                                <p className="text-sm text-gray-700">{r.content}</p>
                              </div>
                            </div>
                          ))}
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
          <h2 className="font-bold text-sm mb-4 uppercase tracking-wider text-gray-400">Related Videos</h2>
          {relatedVideos.map((v) => (
            <Link key={v.id} href={`/watch/${v.id}`} className="flex gap-2 mb-4 group">
              <div className="relative w-32 h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
                  alt={v.title} fill className="object-cover group-hover:scale-105 transition-transform"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold line-clamp-2 leading-tight mb-1 group-hover:text-blue-600 transition-colors">{v.title}</p>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                  {v.profiles?.channel_name}
                  {v.profiles?.is_verified && <Image src="/verified.svg" alt="v" width={10} height={10} />}
                </div>
                <p className="text-[10px] text-gray-400 mt-0.5">{v.views.toLocaleString()} views</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

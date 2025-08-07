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

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("comments")
      .select("id", { count: "exact", head: true })
      .eq("user_id", currentUserId)
      .gte("created_at", oneHourAgo);

    if ((count ?? 0) >= 2) {
      setCommentError("You can only post 2 comments per hour.");
      return;
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
    if (!editComment || !editComment.content.trim()) {
      console.log("Edit comment invalid:", editComment);
      return;
    }

    const { error } = await supabase
      .from("comments")
      .update({ content: editComment.content, edited: true })
      .eq("id", editComment.id);

    if (error) {
      console.error("Edit comment failed:", error.message);
      return;
    }

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

  if (!video) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="mt-24 pb-10 px-4 max-w-6xl mx-auto">
      {/* ...Video player & video info... (tidak diubah) */}

      {/* Comment Section */}
      <div className="mt-6">
        <h2 className="font-semibold mb-3">Comments ({comments.length})</h2>

        <div className="flex flex-col gap-1 mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 border rounded px-3 py-2"
            />
            <button onClick={handleAddComment} className="bg-red-500 text-white px-4 py-2 rounded">
              Post
            </button>
          </div>
          {commentError && (
            <div className={`text-sm px-3 py-2 rounded bg-red-100 text-red-700 mt-1 transition-all ${fadeOut ? "opacity-0" : ""}`}>
              {commentError}
            </div>
          )}
        </div>

        {comments.map((c) => {
          const isOwner = c.user_id === currentUserId;
          const canDelete = isOwner || video?.profiles?.id === currentUserId || currentUserProfile?.is_mod;

          return (
            <div key={c.id} className="mb-4">
              <div className="flex gap-2">
                <Image
                  src={getAvatarUrl(c.profiles.avatar_url, c.profiles.username)}
                  alt="avatar"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <p className="font-semibold">{c.profiles.channel_name || c.profiles.username}</p>
                  <p className="text-sm text-gray-600">{timeAgo(c.created_at)} {c.edited && "[edited]"}</p>

                  {editComment?.id === c.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="text"
                        value={editComment.content}
                        onChange={(e) => setEditComment({ ...editComment, content: e.target.value })}
                        className="border px-2 py-1 rounded text-sm flex-1"
                      />
                      <button onClick={handleEditComment} className="text-blue-500 text-sm">Save</button>
                      <button onClick={() => setEditComment(null)} className="text-gray-500 text-sm">Cancel</button>
                    </div>
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap">{c.content}</p>
                  )}

                  {canDelete && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => setEditComment({ id: c.id, content: c.content })}
                        className="text-blue-600 text-xs underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(c.id)}
                        className="text-red-600 text-xs underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-md w-80">
            <h2 className="text-lg font-semibold mb-4">Confirm Deletion</h2>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to delete this comment?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
              <button onClick={() => handleDeleteComment(confirmDeleteId)} className="bg-red-500 text-white px-4 py-2 rounded">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

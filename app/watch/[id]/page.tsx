"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  channel_name?: string;
  is_verified?: boolean;
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
  parent_id: string | null;
  edited?: boolean;
  profiles: Profile;
}

export default function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyComment, setReplyComment] = useState<{ [key: string]: string }>({});
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [editComment, setEditComment] = useState<{ id: string; content: string } | null>(null);

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      const { data: videoData } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, channel_name, is_verified)")
        .eq("id", id)
        .single();

      if (videoData) {
        setVideo({
          ...videoData,
          profiles: videoData.profiles
            ? {
                id: videoData.profiles.id,
                username: videoData.profiles.username,
                avatar_url: videoData.profiles.avatar_url,
                channel_name: videoData.profiles.channel_name,
                is_verified: videoData.profiles.is_verified,
              }
            : { id: "", username: "Unknown", avatar_url: null, channel_name: "", is_verified: false },
        });

        // ✅ Tambah views
        await supabase
          .from("videos")
          .update({ views: (videoData.views || 0) + 1 })
          .eq("id", id);
      }
    };

    const fetchRelatedVideos = async () => {
      const { data: relatedData } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, channel_name, is_verified)")
        .neq("id", id)
        .limit(10);

      setRelatedVideos(
        relatedData?.map((v) => ({
          ...v,
          profiles: v.profiles
            ? {
                id: v.profiles.id,
                username: v.profiles.username,
                avatar_url: v.profiles.avatar_url,
                channel_name: v.profiles.channel_name,
                is_verified: v.profiles.is_verified,
              }
            : { id: "", username: "Unknown", avatar_url: null, channel_name: "", is_verified: false },
        })) || []
      );
    };

    const fetchComments = async () => {
      const { data: commentData } = await supabase
        .from("comments")
        .select("*, profiles(id, username, avatar_url, is_verified)")
        .eq("video_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      setComments(
        commentData?.map((c) => ({
          ...c,
          profiles: c.profiles
            ? {
                id: c.profiles.id,
                username: c.profiles.username,
                avatar_url: c.profiles.avatar_url,
                is_verified: c.profiles.is_verified,
              }
            : { id: "", username: "Unknown", avatar_url: null, is_verified: false },
        })) || []
      );
    };

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };

    const fetchLikes = async () => {
      const { data: likesData } = await supabase
        .from("video_likes")
        .select("type, user_id")
        .eq("video_id", id);

      const likeCount = likesData?.filter((v) => v.type === "like").length || 0;
      const dislikeCount = likesData?.filter((v) => v.type === "dislike").length || 0;

      setLikes(likeCount);
      setDislikes(dislikeCount);

      const current = likesData?.find((v) => v.user_id === currentUserId);
      setUserVote(current ? (current.type as "like" | "dislike") : null);
    };

    fetchVideo();
    fetchRelatedVideos();
    fetchComments();
    fetchUser().then(fetchLikes);
  }, [id, currentUserId]);

  const refreshComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(id, username, avatar_url, is_verified)")
      .eq("video_id", id)
      .order("created_at", { ascending: false });

    setComments(
      data?.map((c) => ({
        ...c,
        profiles: c.profiles
          ? {
              id: c.profiles.id,
              username: c.profiles.username,
              avatar_url: c.profiles.avatar_url,
              is_verified: c.profiles.is_verified,
            }
          : { id: "", username: "Unknown", avatar_url: null, is_verified: false },
      })) || []
    );
  };

  // ✅ Add Comment
  const handleAddComment = async () => {
    if (!currentUserId) {
      alert("You need to log in to comment");
      return;
    }
    if (!newComment.trim()) return;

    await supabase.from("comments").insert({
      video_id: id,
      content: newComment,
      user_id: currentUserId,
    });

    setNewComment("");
    refreshComments();
  };

  // ✅ Reply Comment
  const handleReplyComment = async (parentId: string) => {
    if (!currentUserId) {
      alert("You need to log in to reply");
      return;
    }
    if (!replyComment[parentId]?.trim()) return;

    await supabase.from("comments").insert({
      video_id: id,
      content: replyComment[parentId],
      parent_id: parentId,
      user_id: currentUserId,
    });

    setReplyComment((prev) => ({ ...prev, [parentId]: "" }));
    refreshComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
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
    if (!currentUserId) {
      alert("You need to log in to like or dislike");
      return;
    }

    if (userVote === type) {
      await supabase
        .from("video_likes")
        .delete()
        .eq("video_id", id)
        .eq("user_id", currentUserId);

      if (type === "like") setLikes((prev) => prev - 1);
      else setDislikes((prev) => prev - 1);

      setUserVote(null);
    } else {
      await supabase.from("video_likes").upsert({
        video_id: id,
        user_id: currentUserId,
        type,
      });

      if (type === "like") {
        if (userVote === "dislike") setDislikes((prev) => prev - 1);
        setLikes((prev) => prev + 1);
      } else {
        if (userVote === "like") setLikes((prev) => prev - 1);
        setDislikes((prev) => prev + 1);
      }

      setUserVote(type);
    }
  };

  if (!video) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="w-full bg-white-50 mt-24 pb-10">
      <div className="max-w-6xl mx-auto px-4 md:px-6 flex flex-col md:flex-row gap-6">
        {/* Video Section */}
        <div className="flex-1 max-w-3xl">
          <div className="relative w-full bg-black rounded-lg overflow-hidden">
            <video
              src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
              controls
              className="w-full max-h-[480px] object-contain"
            />
          </div>
          <h1 className="text-xl font-bold mt-4 mb-2">{video.title}</h1>
          <div className="flex items-center gap-3 mb-4">
            <Link href={`/${video.profiles.username}`}>
              <Image
                src={
                  video.profiles.avatar_url
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                    : `https://ui-avatars.com/api/?name=${video.profiles.channel_name || video.profiles.username}`
                }
                alt="avatar"
                width={40}
                height={40}
                className="rounded-full w-10 h-10 object-cover"
              />
            </Link>
            <div className="flex-1">
              <Link
                href={`/${video.profiles.username}`}
                className="font-semibold hover:underline flex items-center gap-1"
              >
                {video.profiles.channel_name || video.profiles.username}
                {video.profiles.is_verified && (
                  <Image
                    src="/verified.svg"
                    alt="verified"
                    width={14}
                    height={14}
                    className="inline-block"
                    title="VERIFIED USER"
                  />
                )}
              </Link>
              <p className="text-sm text-gray-500">
                {video.views} views • {new Date(video.created_at).toLocaleString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleVote("like")}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  userVote === "like"
                    ? "bg-blue-100 text-blue-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                👍 {likes}
              </button>
              <button
                onClick={() => handleVote("dislike")}
                className={`flex items-center gap-1 px-2 py-1 rounded ${
                  userVote === "dislike"
                    ? "bg-red-100 text-red-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                👎 {dislikes}
              </button>
            </div>
          </div>
          <p className="mb-6">{video.description}</p>

          {/* Comments */}
          <div className="mt-6">
            <h2 className="font-semibold mb-3">Comments ({comments.length})</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 border rounded px-3 py-2"
              />
              <button
                onClick={handleAddComment}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Post
              </button>
            </div>

            {comments.map((c) => {
              const isOwner = c.user_id === currentUserId;
              return (
                <div key={c.id} className="mb-3">
                  <div className="flex gap-2">
                    <Link href={`/${c.profiles.username}`}>
                      <Image
                        src={
                          c.profiles.avatar_url
                            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${c.profiles.avatar_url}`
                            : `https://ui-avatars.com/api/?name=${c.profiles.username}`
                        }
                        alt="avatar"
                        width={32}
                        height={32}
                        className="rounded-full w-8 h-8 object-cover"
                      />
                    </Link>
                    <div>
                      <p className="font-semibold flex items-center gap-1">
                        {c.profiles.username}
                        {c.profiles.is_verified && (
                          <Image
                            src="/verified.svg"
                            alt="verified"
                            width={12}
                            height={12}
                            title="VERIFIED USER"
                          />
                        )}
                        {c.edited && (
                          <span className="text-xs text-gray-500">[edited]</span>
                        )}
                      </p>
                      {editComment?.id === c.id ? (
                        <div className="flex gap-2 mt-1">
                          <input
                            type="text"
                            value={editComment.content}
                            onChange={(e) =>
                              setEditComment({ ...editComment, content: e.target.value })
                            }
                            className="border px-2 py-1 rounded text-sm"
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
                        <p>{c.content}</p>
                      )}

                      <div className="flex gap-3 text-xs text-gray-500 mt-1">
                        {isOwner && (
                          <>
                            <button
                              onClick={() => handleDeleteComment(c.id)}
                              className="text-red-500"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Related Videos */}
        <div className="w-full md:w-72">
          <h2 className="font-semibold mb-3">Related Videos</h2>
          {relatedVideos.map((v) => (
            <Link
              key={v.id}
              href={`/watch/${v.id}`}
              className="flex gap-2 mb-3 hover:bg-gray-100 p-1 rounded"
            >
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
                  <Link
                    href={`/${v.profiles.username}`}
                    className="hover:underline flex items-center gap-1"
                  >
                    {v.profiles.channel_name || v.profiles.username}
                    {v.profiles.is_verified && (
                      <Image
                        src="/verified.svg"
                        alt="verified"
                        width={10}
                        height={10}
                        title="VERIFIED USER"
                      />
                    )}
                  </Link>
                </div>
                <p className="text-xs text-gray-500">{v.views} views</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

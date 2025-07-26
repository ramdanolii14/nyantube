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
  const [replyOpen, setReplyOpen] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyLimit, setReplyLimit] = useState<Record<string, number>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      const { data: videoData } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, channel_name)")
        .eq("id", id)
        .single();

      setVideo({
        ...videoData,
        profiles: videoData.profiles
          ? {
              id: videoData.profiles.id,
              username: videoData.profiles.username,
              avatar_url: videoData.profiles.avatar_url,
              channel_name: videoData.profiles.channel_name,
            }
          : { id: "", username: "Unknown", avatar_url: null, channel_name: "" },
      });

      await supabase
        .from("videos")
        .update({ views: (videoData.views || 0) + 1 })
        .eq("id", id);
    };

    const fetchRelatedVideos = async () => {
      const { data: relatedData } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, channel_name)")
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
              }
            : { id: "", username: "Unknown", avatar_url: null, channel_name: "" },
        })) || []
      );
    };

    const fetchComments = async () => {
      const { data: commentData } = await supabase
        .from("comments")
        .select("*, profiles(id, username, avatar_url)")
        .eq("video_id", id)
        .order("created_at", { ascending: false });

      setComments(
        commentData?.map((c) => ({
          ...c,
          profiles: c.profiles
            ? {
                id: c.profiles.id,
                username: c.profiles.username,
                avatar_url: c.profiles.avatar_url,
              }
            : { id: "", username: "Unknown", avatar_url: null },
        })) || []
      );
    };

    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };

    fetchVideo();
    fetchRelatedVideos();
    fetchComments();
    fetchUser();
  }, [id]);

  const refreshComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(id, username, avatar_url)")
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
            }
          : { id: "", username: "Unknown", avatar_url: null },
      })) || []
    );
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await supabase.from("comments").insert({
      video_id: id,
      content: newComment,
    });
    setNewComment("");
    refreshComments();
  };

  const handleReply = async (parentId: string) => {
    if (!replyText[parentId]?.trim()) return;
    await supabase.from("comments").insert({
      video_id: id,
      content: replyText[parentId],
      parent_id: parentId,
    });
    setReplyText((prev) => ({ ...prev, [parentId]: "" }));
    refreshComments();
  };

  const handleEditComment = async (commentId: string) => {
    if (!editingText.trim()) return;
    await supabase
      .from("comments")
      .update({ content: editingText, edited: true })
      .eq("id", commentId);
    setEditingCommentId(null);
    setEditingText("");
    refreshComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Yakin ingin menghapus komentar ini?")) return;
    await supabase.from("comments").delete().eq("id", commentId);
    refreshComments();
  };

  const loadMoreReplies = (parentId: string) => {
    setReplyLimit((prev) => ({
      ...prev,
      [parentId]: (prev[parentId] || 2) + 3,
    }));
  };

  if (!video) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="w-full bg-gray-50 mt-24 pb-10">
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
            <Image
              src={
                video.profiles.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : "/default-avatar.png"
              }
              alt="avatar"
              width={40}
              height={40}
              className="rounded-full w-10 h-10 object-cover"
            />
            <div>
              <p className="font-semibold">{video.profiles.username}</p>
              <p className="text-sm text-gray-500">
                {video.views} views • {new Date(video.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <p className="mb-6">{video.description}</p>

          {/* Comments Section */}
          <div className="mt-6">
            <h2 className="font-semibold mb-3">Comments</h2>
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

            {comments
              .filter((c) => !c.parent_id)
              .map((c) => {
                const replies = comments.filter((r) => r.parent_id === c.id);
                const limitedReplies = replies.slice(
                  0,
                  replyLimit[c.id] || 2
                );
                return (
                  <div key={c.id} className="mb-4">
                    <div className="flex gap-2">
                      <Image
                        src={
                          c.profiles.avatar_url
                            ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${c.profiles.avatar_url}`
                            : "/default-avatar.png"
                        }
                        alt="avatar"
                        width={32}
                        height={32}
                        className="rounded-full w-8 h-8 object-cover"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">
                          {c.profiles.username}{" "}
                          {c.edited && (
                            <span className="text-gray-400 text-xs">[edit]</span>
                          )}
                        </p>
                        {editingCommentId === c.id ? (
                          <div className="space-y-1">
                            <textarea
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="border rounded w-full text-sm p-1"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditComment(c.id)}
                                className="text-xs text-blue-600"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingCommentId(null)}
                                className="text-xs text-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm">{c.content}</p>
                        )}
                        <div className="flex gap-3 mt-1 text-xs text-blue-600">
                          <button
                            onClick={() =>
                              setReplyOpen((prev) => ({
                                ...prev,
                                [c.id]: !prev[c.id],
                              }))
                            }
                          >
                            Reply
                          </button>
                          {currentUserId === c.user_id && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditingText(c.content);
                                }}
                                className="text-green-600"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-red-600"
                              >
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Reply Form */}
                    {replyOpen[c.id] && (
                      <div className="ml-10 mt-2">
                        <textarea
                          value={replyText[c.id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [c.id]: e.target.value,
                            }))
                          }
                          placeholder="Write a reply..."
                          className="border p-1 rounded w-full text-sm"
                        />
                        <button
                          onClick={() => handleReply(c.id)}
                          className="text-xs text-blue-600 mt-1"
                        >
                          Post Reply
                        </button>
                      </div>
                    )}

                    {/* Replies */}
                    <div className="ml-10 mt-2 space-y-2">
                      {limitedReplies.map((r) => (
                        <div key={r.id} className="flex gap-2">
                          <Image
                            src={
                              r.profiles.avatar_url
                                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${r.profiles.avatar_url}`
                                : "/default-avatar.png"
                            }
                            alt="avatar"
                            width={28}
                            height={28}
                            className="rounded-full w-7 h-7 object-cover"
                          />
                          <div>
                            <p className="font-semibold text-xs">
                              {r.profiles.username}{" "}
                              {r.edited && (
                                <span className="text-gray-400 text-[10px]">
                                  [edit]
                                </span>
                              )}
                            </p>
                            <p className="text-xs">{r.content}</p>
                            {currentUserId === r.user_id && (
                              <div className="flex gap-2 text-[10px] mt-1">
                                <button
                                  onClick={() => {
                                    setEditingCommentId(r.id);
                                    setEditingText(r.content);
                                  }}
                                  className="text-green-600"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteComment(r.id)}
                                  className="text-red-600"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {replies.length > (replyLimit[c.id] || 2) && (
                        <button
                          onClick={() => loadMoreReplies(c.id)}
                          className="text-xs text-gray-500"
                        >
                          View More Replies
                        </button>
                      )}
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
                <p className="text-xs text-gray-500">{v.profiles.username}</p>
                <p className="text-xs text-gray-500">{v.views} views</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

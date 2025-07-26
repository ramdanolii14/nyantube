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
  profiles: Profile;
}

export default function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchVideo = async () => {
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, channel_name)")
        .eq("id", id)
        .single();

      if (videoError) throw videoError;

      setVideo({
        ...videoData,
        profiles: videoData.profiles
          ? {
              id: videoData.profiles.id || "",
              username: videoData.profiles.username || "Unknown",
              avatar_url: videoData.profiles.avatar_url || null,
              channel_name: videoData.profiles.channel_name || "",
            }
          : {
              id: "",
              username: "Unknown",
              avatar_url: null,
              channel_name: "",
            },
      });

      await supabase
        .from("videos")
        .update({ views: (videoData.views || 0) + 1 })
        .eq("id", id);
    };

    const fetchRelatedVideos = async () => {
      const { data: relatedData, error: relatedError } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, channel_name)")
        .neq("id", id)
        .limit(10);

      if (relatedError) throw relatedError;

      setRelatedVideos(
        (relatedData || []).map((v) => ({
          ...v,
          profiles: v.profiles
            ? {
                id: v.profiles.id || "",
                username: v.profiles.username || "Unknown",
                avatar_url: v.profiles.avatar_url || null,
                channel_name: v.profiles.channel_name || "",
              }
            : {
                id: "",
                username: "Unknown",
                avatar_url: null,
                channel_name: "",
              },
        }))
      );
    };

    const fetchComments = async () => {
      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .select("*, profiles(id, username, avatar_url)")
        .eq("video_id", id)
        .order("created_at", { ascending: false });

      if (commentError) throw commentError;

      setComments(
        (commentData || []).map((c) => ({
          ...c,
          profiles: c.profiles
            ? {
                id: c.profiles.id || "",
                username: c.profiles.username || "Unknown",
                avatar_url: c.profiles.avatar_url || null,
              }
            : {
                id: "",
                username: "Unknown",
                avatar_url: null,
              },
        }))
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    const { error } = await supabase.from("comments").insert({
      video_id: id,
      content: newComment,
    });
    if (!error) {
      setNewComment("");
      const { data } = await supabase
        .from("comments")
        .select("*, profiles(id, username, avatar_url)")
        .eq("video_id", id)
        .order("created_at", { ascending: false });
      setComments(
        (data || []).map((c) => ({
          ...c,
          profiles: c.profiles
            ? {
                id: c.profiles.id || "",
                username: c.profiles.username || "Unknown",
                avatar_url: c.profiles.avatar_url || null,
              }
            : {
                id: "",
                username: "Unknown",
                avatar_url: null,
              },
        }))
      );
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments(comments.filter((c) => c.id !== commentId));
  };

  if (!video) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-6 flex flex-col md:flex-row gap-6">
      {/* Video Section */}
      <div className="flex-1">
        <div className="relative w-full max-w-3xl mx-auto bg-black rounded-lg overflow-hidden">
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
            className="rounded-full w-10 h-10"
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
          {comments.map((c) => {
            const safeProfile = c.profiles || {
              id: "",
              username: "Unknown",
              avatar_url: null,
            };
            const isOwner = c.user_id === video.profiles?.id;
            const isSelf = c.user_id === currentUserId;

            return (
              <div
                key={c.id}
                className="flex justify-between items-start gap-2 mb-3"
              >
                <div className="flex gap-2">
                  <Image
                    src={
                      safeProfile.avatar_url
                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${safeProfile.avatar_url}`
                        : "/default-avatar.png"
                    }
                    alt="avatar"
                    width={32}
                    height={32}
                    className="rounded-full w-8 h-8"
                  />
                  <div>
                    <p className="font-semibold">{safeProfile.username}</p>
                    <p>{c.content}</p>
                  </div>
                </div>
                {(isOwner || isSelf) && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-red-500 text-sm"
                  >
                    Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Related Videos */}
      <div className="w-full md:w-72">
        <h2 className="font-semibold mb-3">Related Videos</h2>
        {relatedVideos.map((v) => {
          const safeProfile = v.profiles || {
            id: "",
            username: "Unknown",
            avatar_url: null,
          };

          return (
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
                <p className="text-sm font-semibold line-clamp-2">
                  {v.title}
                </p>
                <p className="text-xs text-gray-500">{safeProfile.username}</p>
                <p className="text-xs text-gray-500">{v.views} views</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

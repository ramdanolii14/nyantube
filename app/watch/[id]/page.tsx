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

  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<"like" | "dislike" | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

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

      // Tambah views
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

    const fetchLikes = async () => {
      const { data: likesData } = await supabase
        .from("video_likes")
        .select("type, user_id")
        .eq("video_id", id);

      const likeCount = likesData?.filter((v) => v.type === "like").length || 0;
      const dislikeCount =
        likesData?.filter((v) => v.type === "dislike").length || 0;

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

  const handleVote = async (type: "like" | "dislike") => {
    if (!currentUserId) {
      alert("You need to log in to like or dislike");
      return;
    }

    if (userVote === type) {
      // Unvote
      await supabase
        .from("video_likes")
        .delete()
        .eq("video_id", id)
        .eq("user_id", currentUserId);

      if (type === "like") setLikes((prev) => prev - 1);
      else setDislikes((prev) => prev - 1);

      setUserVote(null);
    } else {
      // Upsert (insert or update)
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

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await supabase.from("comments").insert({
      video_id: id,
      content: newComment,
    });
    setNewComment("");
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
            <div className="flex-1">
              <p className="font-semibold">{video.profiles.username}</p>
              <p className="text-sm text-gray-500">
                {video.views} views • {new Date(video.created_at).toLocaleString()}
              </p>
            </div>

            {/* Like Dislike */}
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

            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 mb-3">
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
                <div>
                  <p className="font-semibold">{c.profiles.username}</p>
                  <p>{c.content}</p>
                </div>
              </div>
            ))}
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

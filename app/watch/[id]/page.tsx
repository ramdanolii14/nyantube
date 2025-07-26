"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";

interface Profile {
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
  profiles: Profile | null;
}

export default function WatchPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const router = useRouter();
  const [video, setVideo] = useState<Video | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // ✅ Ambil data video, related, dan komentar
  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);

      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select(
          `id, title, description, video_url, thumbnail_url, views, created_at,
           profiles (username, avatar_url, channel_name, id)`
        )
        .eq("id", id)
        .single();

      if (videoError) throw videoError;

      setVideo({
        ...videoData,
        profiles: videoData.profiles ?? {
          username: "Unknown",
          avatar_url: null,
        },
      });

      // Tambah views
      await supabase
        .from("videos")
        .update({ views: (videoData.views || 0) + 1 })
        .eq("id", id);

      const { data: relatedData } = await supabase
        .from("videos")
        .select(
          `id, title, thumbnail_url, views, created_at,
           profiles (username, channel_name, avatar_url, id)`
        )
        .neq("id", id)
        .limit(5);

      setRelatedVideos(
        relatedData?.map((v) => ({
          ...v,
          profiles: v.profiles ?? {
            username: "Unknown",
            avatar_url: null,
          },
        })) || []
      );

      const { data: commentData } = await supabase
        .from("comments")
        .select(
          `id, content, created_at, user_id,
           profiles (username, avatar_url, channel_name)`
        )
        .eq("video_id", id)
        .order("created_at", { ascending: false });

      setComments(
        commentData?.map((c) => ({
          ...c,
          profiles: c.profiles ?? {
            username: "Unknown",
            avatar_url: null,
          },
        })) || []
      );
    };

    fetchData();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([{ video_id: id, content: newComment }])
      .select(
        `id, content, created_at, user_id,
         profiles (username, avatar_url, channel_name)`
      )
      .single();

    if (!error && data) {
      setComments((prev) => [
        {
          ...data,
          profiles: data.profiles ?? {
            username: "Unknown",
            avatar_url: null,
          },
        },
        ...prev,
      ]);
      setNewComment("");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  if (!video) return <p className="p-4">Loading...</p>;

  return (
    <div className="flex flex-col md:flex-row max-w-7xl mx-auto p-4 mt-6">
      {/* Video Utama */}
      <div className="md:w-2/3 w-full md:pr-6">
        <video
          src={video.video_url}
          controls
          className="w-full rounded-lg"
        ></video>
        <h1 className="text-xl font-bold mt-3">{video.title}</h1>
        <p className="text-sm text-gray-500">
          {video.views}x ditonton • {new Date(video.created_at).toLocaleDateString()}
        </p>
        <div className="flex items-center mt-3">
          <Image
            src={video.profiles.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profiles?.username || "Unknown")}&background=random`}
            alt={video.profiles.username}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div className="ml-2">
            <p className="font-semibold">{video.profiles.username}</p>
            <p className="text-xs text-gray-500">
              {video.profiles.channel_name || ""}
            </p>
          </div>
        </div>
        <p className="mt-3">{video.description}</p>

        {/* Komentar */}
        <div className="mt-6">
          <h3 className="font-semibold mb-2">Komentar</h3>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Tulis komentar..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 border rounded px-2 py-1"
            />
            <button
              onClick={handleAddComment}
              className="bg-red-500 text-white px-3 py-1 rounded"
            >
              Kirim
            </button>
          </div>

          {comments.map((c) => {
            const isOwner = c.user_id === (video as any).profiles?.id; // kreator video
            const isSelf = c.user_id === currentUserId; // pengomentar
            return (
              <div
                key={c.id}
                className="flex justify-between items-start gap-2 mb-3"
              >
                <div className="flex items-start gap-2">
                  <Image
                    src={c.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.profiles?.username || "Unknown")}&background=random`}
                    alt={c.profiles?.username || "Unknown"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div>
                    <p className="text-sm font-semibold">
                      {c.profiles?.username ?? "Unknown"}
                    </p>
                    <p className="text-sm">{c.content}</p>
                  </div>
                </div>
                {(isSelf || isOwner) && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Related Videos */}
      <div className="md:w-1/3 w-full mt-6 md:mt-0">
        {relatedVideos.map((v) => (
          <div
            key={v.id}
            onClick={() => router.push(`/watch/${v.id}`)}
            className="flex gap-2 mb-3 cursor-pointer"
          >
            <div className="relative w-40 h-24 bg-gray-200 rounded-md overflow-hidden">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
                alt={v.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold line-clamp-2">{v.title}</p>
              <p className="text-xs text-gray-500">
                {v.profiles?.username ?? "Unknown"}
              </p>
              <p className="text-xs text-gray-500">{v.views}x ditonton</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

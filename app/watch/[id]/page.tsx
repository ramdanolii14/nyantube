"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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
  user_id: string;
  profiles: Profile;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
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
    const fetchData = async () => {
      // ✅ Ambil user sekarang
      const { data: userData } = await supabase.auth.getUser();
      setCurrentUserId(userData.user?.id ?? null);

      // ✅ Ambil video utama
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select("*, profiles(username, avatar_url, channel_name)")
        .eq("id", id)
        .single();

      if (videoError) throw videoError;
      setVideo(videoData as Video);

      // ✅ Update views
      await supabase
        .from("videos")
        .update({ views: (videoData.views || 0) + 1 })
        .eq("id", id);

      // ✅ Ambil related videos
      const { data: relatedData, error: relatedError } = await supabase
        .from("videos")
        .select("*, profiles(username, avatar_url, channel_name)")
        .neq("id", id)
        .limit(6);

      if (relatedError) throw relatedError;
      setRelatedVideos(
        relatedData.map((v: any) => ({
          ...v,
          profiles: Array.isArray(v.profiles) ? v.profiles[0] : v.profiles,
        }))
      );

      // ✅ Ambil komentar
      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .select("*, profiles(username, avatar_url, channel_name)")
        .eq("video_id", id)
        .order("created_at", { ascending: false });

      if (commentError) throw commentError;
      setComments(commentData as Comment[]);
    };

    fetchData();
  }, [id]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([{ video_id: id, user_id: currentUserId, content: newComment }])
      .select("*, profiles(username, avatar_url, channel_name)")
      .single();

    if (!error && data) {
      setComments([data, ...comments]);
      setNewComment("");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);
    if (!error) {
      setComments(comments.filter((c) => c.id !== commentId));
    }
  };

  if (!video) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="flex gap-5 px-8 py-6">
      {/* ✅ Video Utama */}
      <div className="flex-1">
        <video
          controls
          className="rounded-lg w-full mb-4"
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
        ></video>

        <h1 className="text-xl font-bold mb-1">{video.title}</h1>
        <p className="text-gray-600 text-sm mb-3">
          {video.views}x ditonton • {new Date(video.created_at).toLocaleDateString()}
        </p>

        <div className="flex items-center gap-3 mb-4">
          <Image
            src={
              video.profiles.avatar_url
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                : "/default-avatar.png"
            }
            alt={video.profiles.username}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <p className="font-semibold">{video.profiles.username}</p>
            <p className="text-gray-500 text-sm">{video.profiles.channel_name ?? ""}</p>
          </div>
        </div>

        <p className="mb-5 text-gray-700">{video.description}</p>

        {/* ✅ Komentar */}
        <h2 className="text-lg font-semibold mb-3">Komentar</h2>
        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            placeholder="Tulis komentar..."
            className="flex-1 border rounded p-2"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <button
            onClick={handleAddComment}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Kirim
          </button>
        </div>

        <div>
          {comments.map((c) => {
            const isOwner = c.user_id === video.user_id;
            const isSelf = c.user_id === currentUserId;
            return (
              <div
                key={c.id}
                className="flex justify-between items-start gap-2 mb-3"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={
                      c.profiles.avatar_url
                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${c.profiles.avatar_url}`
                        : "/default-avatar.png"
                    }
                    alt={c.profiles.username}
                    width={35}
                    height={35}
                    className="rounded-full"
                  />
                  <div>
                    <p className="font-semibold">{c.profiles.username}</p>
                    <p className="text-gray-700">{c.content}</p>
                  </div>
                </div>
                {(isOwner || isSelf) && (
                  <button
                    onClick={() => handleDeleteComment(c.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Hapus
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ Related Videos */}
      <div className="w-72">
        {relatedVideos.map((v) => (
          <div key={v.id} className="flex gap-2 mb-3">
            <div className="relative w-40 h-24 bg-gray-200 rounded-md overflow-hidden">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
                alt={v.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="text-sm">
              <p className="font-semibold">{v.title}</p>
              <p className="text-gray-600">{v.profiles.username}</p>
              <p className="text-gray-600">{v.views}x ditonton</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

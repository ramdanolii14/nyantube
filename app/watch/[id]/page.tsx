"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Profile {
  username: string;
  avatar_url: string | null;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  user_id: string;
  created_at: string;
  likes: number;
  dislikes: number;
  profiles?: Profile;
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [newComment, setNewComment] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data.user) setUserId(data.user.id);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!id) return;

    const fetchAll = async () => {
      try {
        // ✅ Ambil video utama
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select("*")
          .eq("id", id)
          .single();

        if (videoError || !videoData) return;

        const [profileData, likeCount, dislikeCount, commentsData, recData] =
          await Promise.all([
            supabase
              .from("profiles")
              .select("username, avatar_url")
              .eq("id", videoData.user_id)
              .single(),
            supabase
              .from("video_likes")
              .select("*", { count: "exact", head: true })
              .eq("video_id", id)
              .eq("type", "like"),
            supabase
              .from("video_likes")
              .select("*", { count: "exact", head: true })
              .eq("video_id", id)
              .eq("type", "dislike"),
            supabase
              .from("comments")
              .select(
                "id, user_id, content, created_at, profiles(username, avatar_url)"
              )
              .eq("video_id", id)
              .order("created_at", { ascending: false }),
            supabase
              .from("videos")
              .select("*")
              .neq("id", id)
              .order("created_at", { ascending: false })
              .limit(5),
          ]);

        setVideo({
          ...videoData,
          likes: likeCount.count || 0,
          dislikes: dislikeCount.count || 0,
          profiles:
            profileData.data || { username: "Unknown", avatar_url: null },
        });

        if (commentsData.data)
          setComments(commentsData.data as unknown as Comment[]);

        if (recData.data) setRecommendations(recData.data as Video[]);
      } catch (err) {
        console.error("FETCH ERROR:", err);
      }
    };

    fetchAll();
  }, [id]);

  if (!video) return <p className="text-center mt-20">Loading video...</p>;

  return (
    <div className="max-w-6xl mx-auto mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 px-3">
      {/* ✅ VIDEO PLAYER */}
      <div className="md:col-span-2">
        <div className="relative w-full rounded-md overflow-hidden bg-black aspect-video">
          <video
            src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
            controls
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        {/* ✅ Channel Info */}
        <div className="flex items-center gap-3 mt-4">
          <Link
            href={`/profile/${video.user_id}`}
            className="flex items-center gap-3 hover:opacity-80 transition"
          >
            <Image
              src={
                video.profiles?.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${video.profiles?.username}`
              }
              alt={video.profiles?.username || "Channel"}
              width={45}
              height={45}
              className="rounded-full"
              unoptimized
            />
            <div>
              <p className="font-bold">{video.profiles?.username}</p>
              <p className="text-sm text-gray-500">Lihat Channel</p>
            </div>
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-2">{video.description}</p>

        <div className="flex gap-4 mt-3">
          <button className="bg-green-500 text-white px-3 py-1 rounded">
            👍 {video.likes}
          </button>
          <button className="bg-red-500 text-white px-3 py-1 rounded">
            👎 {video.dislikes}
          </button>
        </div>

        {/* ✅ KOMENTAR */}
        <hr className="my-5" />
        <h2 className="text-xl font-bold mb-3">Komentar</h2>
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="flex items-start gap-3">
              <Image
                src={
                  c.profiles.avatar_url
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${c.profiles.avatar_url}`
                    : `https://ui-avatars.com/api/?name=${c.profiles.username}`
                }
                alt={c.profiles.username}
                width={40}
                height={40}
                className="rounded-full"
                unoptimized
              />
              <div className="bg-gray-100 p-2 rounded w-full">
                <p className="text-sm font-semibold">{c.profiles.username}</p>
                <p className="text-sm">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Rekomendasi */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold mb-2">Rekomendasi</h2>
        {recommendations.map((v) => (
          <Link
            key={v.id}
            href={`/watch/${v.id}`}
            className="flex gap-3 hover:bg-gray-100 p-2 rounded"
          >
            <Image
              src={
                v.thumbnail_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`
                  : "/default-thumbnail.png"
              }
              alt={v.title}
              width={120}
              height={70}
              className="rounded"
            />
            <div>
              <p className="text-sm font-semibold line-clamp-2">{v.title}</p>
              <p className="text-xs text-gray-500">{v.likes} Likes</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

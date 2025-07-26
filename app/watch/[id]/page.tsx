"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  views: number;
  created_at: string;
  profiles?: {
    username: string;
    avatar_url: string | null;
    channel_name?: string;
  };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  profiles: {
    username: string;
    avatar_url: string | null;
  };
}

export default function WatchPage() {
  const { id: videoId } = useParams();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommendations, setRecommendations] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ Ambil video
        const { data: videoData } = await supabase
          .from("videos")
          .select(
            `id, title, description, video_url, views, created_at,
            profiles (username, avatar_url, channel_name)`
          )
          .eq("id", videoId)
          .single();

        if (videoData) {
          setVideo({
            ...videoData,
            profiles: Array.isArray(videoData.profiles)
              ? videoData.profiles[0]
              : videoData.profiles,
          });
        }

        // ✅ Ambil komentar
        const { data: commentsData } = await supabase
          .from("comments")
          .select(
            `id, user_id, content, created_at, parent_id,
            profiles (username, avatar_url)`
          )
          .eq("video_id", videoId)
          .order("created_at", { ascending: true });

        if (commentsData) {
          setComments(
            commentsData.map((c: any) => ({
              ...c,
              profiles: Array.isArray(c.profiles)
                ? c.profiles[0]
                : c.profiles,
            }))
          );
        }

        // ✅ Ambil rekomendasi video
        const { data: recData } = await supabase
          .from("videos")
          .select(
            `id, title, thumbnail_url, views, created_at,
            profiles (username, avatar_url)`
          )
          .neq("id", videoId)
          .limit(10);

        if (recData) {
          setRecommendations(
            recData.map((v: any) => ({
              ...v,
              profiles: Array.isArray(v.profiles)
                ? v.profiles[0]
                : v.profiles,
            }))
          );
        }
      } catch (err) {
        console.error("❌ Error fetching:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [videoId]);

  if (loading) return <div className="text-center mt-8">Loading video...</div>;
  if (!video) return <div className="text-center mt-8 text-red-500">Video not found</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* 🎥 Video + Info */}
      <div className="md:col-span-2">
        <video
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
          controls
          className="w-full rounded-lg"
        />

        <h1 className="text-xl font-bold mt-4">{video.title}</h1>
        <p className="text-sm text-gray-500">
          {video.views}x ditonton • {new Date(video.created_at).toLocaleDateString()}
        </p>

        <div className="flex items-center gap-3 mt-3">
          <Image
            src={
              video.profiles?.avatar_url
                ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
                : `https://ui-avatars.com/api/?name=${video.profiles?.username || "Unknown"}`
            }
            alt={video.profiles?.username || "Unknown"}
            width={48}
            height={48}
            className="rounded-full border"
          />
          <div>
            <p className="font-semibold">{video.profiles?.channel_name || "Unknown"}</p>
            <p className="text-xs text-gray-500">{video.profiles?.username || "Unknown"}</p>
          </div>
        </div>

        <p className="mt-4 text-sm">{video.description}</p>

        {/* 💬 Komentar */}
        <hr className="my-4" />
        <h2 className="text-lg font-bold">Komentar</h2>
        <div className="space-y-4 mt-3">
          {comments.length > 0 ? (
            comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Image
                  src={
                    c.profiles?.avatar_url
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${c.profiles.avatar_url}`
                      : `https://ui-avatars.com/api/?name=${c.profiles?.username || "Unknown"}`
                  }
                  alt={c.profiles?.username || "Unknown"}
                  width={36}
                  height={36}
                  className="rounded-full border"
                />
                <div>
                  <p className="text-sm font-semibold">{c.profiles?.username}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm">{c.content}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">Belum ada komentar</p>
          )}
        </div>
      </div>

      {/* 📺 Rekomendasi Video */}
      <div className="space-y-3">
        {recommendations.map((v) => (
          <Link
            key={v.id}
            href={`/watch/${v.id}`}
            className="flex gap-2 hover:bg-gray-50 rounded-md p-1"
          >
            <div className="relative w-40 h-24 bg-gray-200 rounded-md overflow-hidden">
              <Image
                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}`}
                alt={v.title}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold line-clamp-2">{v.title}</p>
              <p className="text-xs text-gray-500">{v.profiles?.username}</p>
              <p className="text-xs text-gray-400">
                {v.views}x ditonton • {new Date(v.created_at).toLocaleDateString()}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

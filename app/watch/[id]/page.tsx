"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";

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

export default function WatchPage() {
  const params = useParams();
  const videoId = params.id as string;

  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    const fetchVideoAndComments = async () => {
      try {
        // ✅ Ambil data video
        const { data: videoData, error: videoError } = await supabase
          .from("videos")
          .select(
            `
            id,
            title,
            description,
            video_url,
            views,
            created_at,
            profiles (
              username,
              avatar_url,
              channel_name
            )
          `
          )
          .eq("id", videoId)
          .single();

        if (videoError) throw videoError;
        setVideo(videoData as Video);

        // ✅ Ambil komentar
        const { data: commentsData, error: commentsError } = await supabase
          .from("comments")
          .select(
            `
            id,
            user_id,
            content,
            created_at,
            parent_id,
            profiles (
              username,
              avatar_url
            )
          `
          )
          .eq("video_id", videoId)
          .order("created_at", { ascending: true });

        if (commentsError) throw commentsError;

        // ✅ FIX BUG di sini
        if (commentsData) {
          const mapped: Comment[] = commentsData.map((c: any) => ({
            ...c,
            profiles: Array.isArray(c.profiles) ? c.profiles[0] : c.profiles,
          }));
          setComments(mapped);
        }
      } catch (error) {
        console.error("Error fetching video or comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoAndComments();
  }, [videoId, supabase]);

  if (loading) return <p className="p-4">Loading...</p>;
  if (!video) return <p className="p-4">Video not found.</p>;

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Video Player */}
      <div className="aspect-video bg-black mb-4">
        <video
          controls
          src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
          className="w-full h-full"
        />
      </div>

      {/* Video Info */}
      <h1 className="text-xl font-bold mb-1">{video.title}</h1>
      <p className="text-sm text-gray-500 mb-4">
        {video.views}x ditonton • {new Date(video.created_at).toLocaleDateString()}
      </p>

      {/* Channel Info */}
      <div className="flex items-center gap-2 mb-4">
        <Image
          src={
            video.profiles?.avatar_url
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
              : `https://ui-avatars.com/api/?name=${video.profiles?.username || "Unknown"}`
          }
          alt={video.profiles?.username || "Unknown"}
          width={40}
          height={40}
          className="rounded-full"
          unoptimized
        />
        <div>
          <p className="font-semibold text-sm">
            {video.profiles?.channel_name || video.profiles?.username || "Unknown"}
          </p>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm mb-6">{video.description}</p>

      {/* Comments */}
      <h2 className="text-lg font-bold mb-2">Komentar</h2>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-2">
            <Image
              src={
                comment.profiles.avatar_url
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${comment.profiles.avatar_url}`
                  : `https://ui-avatars.com/api/?name=${comment.profiles.username}`
              }
              alt={comment.profiles.username}
              width={32}
              height={32}
              className="rounded-full"
              unoptimized
            />
            <div>
              <p className="text-sm font-semibold">{comment.profiles.username}</p>
              <p className="text-sm">{comment.content}</p>
              <p className="text-xs text-gray-500">
                {new Date(comment.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

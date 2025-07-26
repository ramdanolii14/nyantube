"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideoAndComments = async () => {
      try {
        console.log("🔄 Fetching video & comments for ID:", videoId);

        // ✅ Ambil video
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
        console.log("✅ Video data:", videoData);

        if (videoData) {
          const mappedVideo: Video = {
            ...videoData,
            profiles: videoData.profiles
              ? Array.isArray(videoData.profiles)
                ? videoData.profiles[0]
                : videoData.profiles
              : {
                  username: "Unknown",
                  avatar_url: null,
                  channel_name: "Unknown",
                },
          };
          setVideo(mappedVideo);
        }

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
        console.log("✅ Comments data:", commentsData);

        if (commentsData) {
          const mappedComments: Comment[] = commentsData.map((c: any) => ({
            ...c,
            profiles: Array.isArray(c.profiles)
              ? c.profiles[0]
              : c.profiles,
          }));
          setComments(mappedComments);
        }
      } catch (error) {
        console.error("❌ Error fetching video or comments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoAndComments();
  }, [videoId]);

  // ✅ Fallback UI
  if (loading) {
    return <div className="text-center mt-8">Loading video...</div>;
  }

  if (!video) {
    return (
      <div className="text-center mt-8 text-red-500">
        Video not found or failed to load.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <video
        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${video.video_url}`}
        controls
        className="w-full rounded-md"
      />
      <h1 className="text-xl font-bold mt-4">{video.title}</h1>
      <p className="text-sm text-gray-500">
        {video.views}x ditonton •{" "}
        {new Date(video.created_at).toLocaleDateString()}
      </p>

      <div className="flex items-center gap-2 mt-2">
        <Image
          src={
            video.profiles?.avatar_url
              ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${video.profiles.avatar_url}`
              : `https://ui-avatars.com/api/?name=${
                  video.profiles?.username || "Unknown"
                }`
          }
          alt={video.profiles?.username || "Unknown"}
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <p className="font-semibold">{video.profiles?.channel_name || "Unknown"}</p>
          <p className="text-xs text-gray-500">
            {video.profiles?.username || "Unknown"}
          </p>
        </div>
      </div>

      <p className="mt-4">{video.description}</p>

      <hr className="my-4" />
      <h2 className="text-lg font-bold">Comments</h2>
      <div className="space-y-4 mt-2">
        {comments.length > 0 ? (
          comments.map((c) => (
            <div key={c.id} className="flex gap-2">
              <Image
                src={
                  c.profiles?.avatar_url
                    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${c.profiles.avatar_url}`
                    : `https://ui-avatars.com/api/?name=${c.profiles?.username || "Unknown"}`
                }
                alt={c.profiles?.username || "Unknown"}
                width={32}
                height={32}
                className="rounded-full"
              />
              <div>
                <p className="text-sm font-semibold">{c.profiles?.username || "Unknown"}</p>
                <p className="text-xs text-gray-500">
                  {new Date(c.created_at).toLocaleString()}
                </p>
                <p>{c.content}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No comments yet.</p>
        )}
      </div>
    </div>
  );
}

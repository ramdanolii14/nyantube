"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import React from "react";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  user_id: string;
  created_at: string;
}

interface Profile {
  username: string;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  profile: {
    username: string;
  };
}

export default function WatchPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();

  const [video, setVideo] = useState<Video | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: videoData, error: videoError } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .single();

      if (videoError || !videoData) {
        router.push("/not-found");
        return;
      }

      setVideo(videoData);

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", videoData.user_id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: commentData } = await supabase
        .from("comments")
        .select("id, content, created_at, profile(username)")
        .eq("video_id", id)
        .order("created_at", { ascending: false });

      if (commentData) {
        setComments(commentData);
      }
    };

    fetchData();
  }, [id, router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!session?.user) {
      router.push("/auth/login");
      return;
    }

    const { data: insertedComment, error } = await supabase
      .from("comments")
      .insert([
        {
          content: newComment,
          video_id: id,
          user_id: session.user.id,
        },
      ])
      .select("id, content, created_at, profile(username)")
      .single();

    if (!error && insertedComment) {
      setComments((prev) => [insertedComment, ...prev]);
      setNewComment("");
    }
  };

  if (!video) return <p className="text-center mt-10">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-2">{video.title}</h1>
      <p className="text-sm text-gray-600 mb-4">By @{profile?.username}</p>
      <video src={video.video_url} controls className="w-full rounded-md mb-6" />

      <p className="text-gray-700 mb-6">{video.description}</p>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Comments</h2>

        {session && (
          <form onSubmit={handleSubmit} className="mb-4">
            <textarea
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border rounded-md"
              required
            />
            <button
              type="submit"
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
            >
              Post Comment
            </button>
          </form>
        )}

        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="mb-4 border-b pb-2">
              <p className="text-sm font-semibold">@{comment.profile.username}</p>
              <p className="text-sm text-gray-700">{comment.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

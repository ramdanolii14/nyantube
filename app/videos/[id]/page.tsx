"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Link from "next/link";
import Image from "next/image";

export default function WatchPage() {
  const { id } = useParams();
  const [video, setVideo] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      const { data } = await supabase
        .from("videos")
        .select(
          "id, title, video_url, thumbnail_url, created_at, profiles(username, avatar_url)"
        )
        .eq("id", id)
        .single();
      if (data) setVideo(data);
    };

    const fetchComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select("id, content, created_at, profiles(username, avatar_url)")
        .eq("video_id", id)
        .order("created_at", { ascending: false });
      if (data) setComments(data);
    };

    const fetchLikes = async () => {
      const { count } = await supabase
        .from("likes")
        .select("*", { count: "exact", head: true })
        .eq("video_id", id);
      setLikes(count || 0);
    };

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase
          .from("likes")
          .select("id")
          .eq("video_id", id)
          .eq("user_id", user.id)
          .single();
        if (data) setLiked(true);
      }
    };

    fetchVideo();
    fetchComments();
    fetchLikes();
    getUser();
  }, [id]);

  const handleLike = async () => {
    if (!user) return alert("Login dulu untuk menyukai video!");

    if (liked) {
      await supabase
        .from("likes")
        .delete()
        .eq("video_id", id)
        .eq("user_id", user.id);
      setLikes((prev) => prev - 1);
      setLiked(false);
    } else {
      await supabase
        .from("likes")
        .insert([{ video_id: id, user_id: user.id }]);
      setLikes((prev) => prev + 1);
      setLiked(true);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Login dulu untuk berkomentar!");
    if (!newComment.trim()) return;

    const { data, error } = await supabase.from("comments").insert([
      {
        video_id: id,
        user_id: user.id,
        content: newComment.trim(),
      },
    ]);

    if (!error) {
      setComments([
        {
          content: newComment.trim(),
          profiles: { username: user.email, avatar_url: "" },
        },
        ...comments,
      ]);
      setNewComment("");
    }
  };

  if (!video) return <p className="p-6">Memuat video...</p>;

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* VIDEO PLAYER */}
      <video
        src={video.video_url}
        controls
        className="w-full rounded-md mb-4"
      ></video>

      {/* VIDEO INFO */}
      <h1 className="text-xl font-bold mb-2">{video.title}</h1>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Image
            src={
              video.profiles?.avatar_url ||
              `https://ui-avatars.com/api/?name=${video.profiles?.username}`
            }
            alt="avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          <span className="font-medium">{video.profiles?.username}</span>
        </div>
        <button
          onClick={handleLike}
          className={`px-4 py-2 rounded-md ${
            liked ? "bg-red-600 text-white" : "bg-gray-200"
          }`}
        >
          👍 {likes}
        </button>
      </div>

      {/* KOMENTAR */}
      <h2 className="text-lg font-bold mb-2">Komentar</h2>
      {user && (
        <form onSubmit={handleComment} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Tulis komentar..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="border p-2 rounded-md flex-1"
          />
          <button
            type="submit"
            className="bg-red-600 text-white px-4 rounded-md hover:bg-red-700"
          >
            Kirim
          </button>
        </form>
      )}
      <div className="space-y-3">
        {comments.map((c, i) => (
          <div key={i} className="flex items-start gap-2">
            <Image
              src={
                c.profiles?.avatar_url ||
                `https://ui-avatars.com/api/?name=${c.profiles?.username}`
              }
              alt="avatar"
              width={32}
              height={32}
              className="rounded-full"
            />
            <div>
              <p className="font-semibold text-sm">{c.profiles?.username}</p>
              <p className="text-sm text-gray-700">{c.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

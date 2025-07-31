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
  is_verified: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  user_id: string;
  created_at: string;
  views: number;
  likes: number;
  dislikes: number;
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
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [user, setUser] = useState<Profile | null>(null);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editedCommentContent, setEditedCommentContent] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setUser(profile);
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchVideo = async () => {
      const { data, error } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, is_verified)")
        .eq("id", id)
        .single();

      if (!error) {
        setVideo(data);
      }
    };

    fetchVideo();
  }, [id]);

  useEffect(() => {
    const fetchComments = async () => {
      const { data: commentData } = await supabase
        .from("comments")
        .select("*, profiles(id, username, avatar_url, is_verified)")
        .eq("video_id", id)
        .order("created_at", { ascending: false })
        .limit(50);

      setComments(commentData || []);
    };

    fetchComments();
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*, profiles(id, username, avatar_url, is_verified)")
        .neq("id", id)
        .limit(5);

      setRelatedVideos(data || []);
    };

    fetchRelated();
  }, [id]);

  const postComment = async () => {
    if (!commentContent.trim() || !user) return;

    const { data, error } = await supabase
      .from("comments")
      .insert({
        content: commentContent,
        user_id: user.id,
        video_id: id,
      })
      .select("*, profiles(id, username, avatar_url, is_verified)")
      .single();

    if (!error && data) {
      setComments([data, ...comments]);
      setCommentContent("");
    }
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  };

  const updateComment = async () => {
    if (!editedCommentContent.trim() || !editingCommentId) return;

    const { error } = await supabase
      .from("comments")
      .update({ content: editedCommentContent })
      .eq("id", editingCommentId);

    if (!error) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === editingCommentId
            ? { ...c, content: editedCommentContent }
            : c
        )
      );
      setEditingCommentId(null);
      setEditedCommentContent("");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 flex gap-6">
      <div className="flex-1">
        {video && (
          <>
            <video
              className="w-full rounded-md"
              src={video.video_url}
              controls
              autoPlay
            />
            <h1 className="text-2xl font-bold mt-4">{video.title}</h1>
            <p className="text-sm text-gray-500 mb-2">
              Uploaded by{" "}
              <Link
                href={`/${video.profiles.username}`}
                className="text-blue-500"
              >
                @{video.profiles.username}
              </Link>{" "}
              • {new Date(video.created_at).toLocaleDateString()}
            </p>
            <p>{video.description}</p>
          </>
        )}

        {/* Comments */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">
            Comments ({comments.length})
          </h2>

          {user && (
            <div className="mb-4">
              <textarea
                className="w-full border rounded p-2"
                rows={3}
                placeholder="Add a comment..."
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />
              <button
                className="mt-2 bg-blue-600 text-white px-4 py-1 rounded"
                onClick={postComment}
              >
                Comment
              </button>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start gap-3">
                <Image
                  src={
                    comment.profiles.avatar_url ||
                    `https://ui-avatars.com/api/?name=${comment.profiles.username}`
                  }
                  alt="avatar"
                  width={36}
                  height={36}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      @{comment.profiles.username}
                    </div>
                    {comment.user_id === user?.id && (
                      <div className="text-sm space-x-2">
                        <button
                          className="text-blue-500"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditedCommentContent(comment.content);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500"
                          onClick={() => deleteComment(comment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  {editingCommentId === comment.id ? (
                    <>
                      <textarea
                        className="w-full border rounded mt-1 p-1"
                        value={editedCommentContent}
                        onChange={(e) =>
                          setEditedCommentContent(e.target.value)
                        }
                      />
                      <div className="mt-1 flex gap-2">
                        <button
                          onClick={updateComment}
                          className="text-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditedCommentContent("");
                          }}
                          className="text-gray-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-1">{comment.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Videos */}
      <div className="w-[300px] space-y-4">
        <h3 className="font-semibold text-lg">Recommended</h3>
        {relatedVideos.map((vid) => (
          <Link
            key={vid.id}
            href={`/watch/${vid.id}`}
            className="flex gap-3 hover:bg-gray-100 p-2 rounded-md"
          >
            <Image
              src={vid.thumbnail_url}
              alt={vid.title}
              width={120}
              height={68}
              className="rounded-md object-cover"
            />
            <div className="text-sm">
              <p className="font-medium">{vid.title}</p>
              <p className="text-gray-600 text-xs mt-1">
                by @{vid.profiles.username}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

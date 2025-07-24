"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleUpload = async () => {
    if (!title || !videoUrl) return alert("Title & URL required!");

    const { error } = await supabase.from("videos").insert([
      {
        title,
        video_url: videoUrl,
        thumbnail_url: `https://img.youtube.com/vi/${videoUrl}/0.jpg`,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Upload failed");
    } else {
      alert("Upload success!");
      setTitle("");
      setVideoUrl("");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Upload Video</h1>
      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <input
        type="text"
        placeholder="Video URL (YouTube ID)"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        className="border p-2 mb-2 w-full"
      />
      <button
        onClick={handleUpload}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Upload
      </button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const handleUpload = async () => {
    const { error } = await supabase.from("videos").insert([
      {
        title,
        video_url: videoUrl,
        thumbnail_url: "", // optional, bisa digenerate nanti
      },
    ]);

    if (error) {
      alert("Upload gagal: " + error.message);
    } else {
      alert("Upload berhasil!");
      setTitle("");
      setVideoUrl("");
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Upload Video</h1>
      <input
        className="border p-2 mb-2 w-full"
        placeholder="Judul Video"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <input
        className="border p-2 mb-2 w-full"
        placeholder="URL Video"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={handleUpload}
      >
        Upload
      </button>
    </div>
  );
}

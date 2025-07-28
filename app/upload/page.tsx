"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@supabase/auth-helpers-react";
import { supabase } from "@/supabase/client";
import { CloudUpload } from "lucide-react";

export default function UploadPage() {
  const user = useUser();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!user) {
      setError("Kamu harus login terlebih dahulu.");
      setLoading(false);
      return;
    }

    if (!videoFile || !thumbnailFile || !title || !description) {
      setError("Harap lengkapi semua field dan file.");
      setLoading(false);
      return;
    }

    await handleUpload(user.id);
  };

  const handleUpload = async (user_id: string) => {
    const timestamp = Date.now();
    const videoPath = `videos/${timestamp}_${videoFile!.name}`;
    const thumbnailPath = `thumbnails/${timestamp}_${thumbnailFile!.name}`;

    const { data: videoData, error: videoErr } = await supabase.storage
      .from("videos")
      .upload(videoPath, videoFile!);

    if (videoErr) {
      setError("Gagal upload video.");
      setLoading(false);
      return;
    }

    const { data: thumbData, error: thumbErr } = await supabase.storage
      .from("thumbnails")
      .upload(thumbnailPath, thumbnailFile!);

    if (thumbErr) {
      setError("Gagal upload thumbnail.");
      setLoading(false);
      return;
    }

    const { error: insertErr } = await supabase.from("videos").insert({
      user_id,
      title,
      description,
      video_url: videoData.path,
      thumbnail_url: thumbData.path,
      views: 0,
      is_public: true,
      likes: 0,
      dislikes: 0,
    });

    if (insertErr) {
      setError("Gagal menyimpan ke database.");
    } else {
      router.push("/");
    }

    setLoading(false);
  };

  const handleDragDrop = (
    e: React.DragEvent<HTMLDivElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>
  ) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) setFile(file);
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded-lg shadow mt-16">
      <h1 className="text-3xl font-bold mb-6 text-center text-red-600">Upload Video</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          className="w-full p-3 border border-gray-300 rounded"
          type="text"
          placeholder="Judul Video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full p-3 border border-gray-300 rounded"
          placeholder="Deskripsi Video"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div
          onDrop={(e) => handleDragDrop(e, setVideoFile)}
          onDragOver={(e) => e.preventDefault()}
          className="w-full p-6 text-center border-2 border-dashed border-red-400 rounded cursor-pointer hover:bg-red-50 transition"
          onClick={() => document.getElementById("videoInput")?.click()}
        >
          <CloudUpload className="mx-auto mb-2 text-red-500" size={32} />
          <p className="text-sm text-gray-600">
            {videoFile ? videoFile.name : "Klik atau seret file video ke sini"}
          </p>
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />
        </div>

        <div
          onDrop={(e) => handleDragDrop(e, setThumbnailFile)}
          onDragOver={(e) => e.preventDefault()}
          className="w-full p-6 text-center border-2 border-dashed border-gray-400 rounded cursor-pointer hover:bg-gray-50 transition"
          onClick={() => document.getElementById("thumbInput")?.click()}
        >
          <CloudUpload className="mx-auto mb-2 text-gray-500" size={32} />
          <p className="text-sm text-gray-600">
            {thumbnailFile ? thumbnailFile.name : "Klik atau seret file thumbnail ke sini"}
          </p>
          <input
            id="thumbInput"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
          />
        </div>

        <button
          className="w-full bg-red-600 text-white py-3 rounded hover:bg-red-700 transition"
          type="submit"
          disabled={loading}
        >
          {loading ? "Mengupload..." : "Upload"}
        </button>

        {error && <p className="text-center text-sm text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
}

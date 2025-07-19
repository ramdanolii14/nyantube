"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
    }
  };

  // ✅ Generate thumbnail otomatis dari video jika user tidak upload thumbnail
  const generateThumbnailFromVideo = (videoUrl: string): Promise<File> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.currentTime = 1; // ambil frame di detik ke-1

      video.onloadeddata = () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error("Failed to create thumbnail"));
          const file = new File([blob], "auto-thumbnail.jpg", {
            type: "image/jpeg",
          });
          resolve(file);
        }, "image/jpeg");
      };

      video.onerror = () => reject(new Error("Failed to load video"));
    });
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!videoFile) throw new Error("Video wajib diupload");

      // ✅ Validasi ukuran & format video
      if (videoFile.size > 100 * 1024 * 1024)
        throw new Error("Ukuran video maksimal 100MB");
      if (!["video/mp4", "video/webm"].includes(videoFile.type))
        throw new Error("Format video hanya mp4 atau webm");

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Anda harus login untuk upload");

      const random = Math.random().toString(36).substring(2, 8);

      // ✅ Upload Video
      const videoExt = videoFile.name.split(".").pop();
      const videoName = `${user.id}-${Date.now()}-${random}.${videoExt}`;
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoName, videoFile);
      if (videoError) throw videoError;

      // ✅ Thumbnail (ambil dari user atau auto-generate)
      let finalThumbnail = thumbnailFile;
      if (!thumbnailFile) {
        finalThumbnail = await generateThumbnailFromVideo(
          URL.createObjectURL(videoFile)
        );
      }

      const thumbExt = finalThumbnail.name.split(".").pop();
      const thumbnailName = `${user.id}-${Date.now()}-${random}.${thumbExt}`;
      const { error: thumbError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailName, finalThumbnail);
      if (thumbError) throw thumbError;

      // ✅ Insert ke Database
      const { data: inserted, error: insertError } = await supabase
        .from("videos")
        .insert([
          {
            user_id: user.id,
            title: title.trim(),
            description: description.trim(),
            video_url: videoName,
            thumbnail_url: thumbnailName,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();
      if (insertError) throw insertError;

      setMessage("✅ Video berhasil diupload!");
      setTimeout(() => router.push(`/watch/${inserted.id}`), 1500);
    } catch (err: any) {
      console.error("UPLOAD ERROR:", err);
      if (err.message.includes("login")) {
        setMessage("❌ Anda harus login untuk upload video.");
      } else {
        setMessage(`❌ Upload gagal: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-20 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleUpload}>
        <input
          type="text"
          placeholder="Judul Video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded w-full mb-3"
          required
        />
        <textarea
          placeholder="Deskripsi Video"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded w-full mb-3"
        ></textarea>

        {/* ✅ Preview Video */}
        {videoPreview && (
          <video src={videoPreview} controls className="mb-2 w-full rounded" />
        )}
        <input
          type="file"
          accept="video/mp4,video/webm"
          onChange={handleVideoChange}
          className="mb-3"
          required
        />

        {/* ✅ Preview Thumbnail */}
        {thumbnailPreview && (
          <img
            src={thumbnailPreview}
            alt="Thumbnail Preview"
            className="mb-2 w-full rounded"
          />
        )}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleThumbnailChange}
          className="mb-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700 transition"
        >
          {loading ? "Mengupload..." : "Upload"}
        </button>
      </form>
      {message && <p className="text-center text-sm mt-3">{message}</p>}
    </div>
  );
}

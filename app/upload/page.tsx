"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!title || !videoFile) {
      alert("Judul dan video wajib diisi!");
      return;
    }

    setLoading(true);

    try {
      // ✅ 1. Upload Video ke bucket "videos"
      const videoExt = videoFile.name.split(".").pop();
      const videoFileName = `${Date.now()}.${videoExt}`;

      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      const videoURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/videos/${videoFileName}`;

      let thumbnailURL = "";

      if (thumbnailFile) {
        // ✅ 2A. Kalau user upload thumbnail manual → langsung upload
        const thumbExt = thumbnailFile.name.split(".").pop();
        const thumbFileName = `${Date.now()}.${thumbExt}`;

        const { error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbFileName, thumbnailFile);

        if (thumbError) throw thumbError;

        thumbnailURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${thumbFileName}`;
      } else {
        // ✅ 2B. Auto-generate thumbnail dari video
        const generatedThumb = await generateThumbnail(videoFile);
        const thumbFileName = `${Date.now()}.jpg`;

        const { error: autoThumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbFileName, generatedThumb);

        if (autoThumbError) throw autoThumbError;

        thumbnailURL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${thumbFileName}`;
      }

      // ✅ 3. Simpan ke tabel videos
      const { error: dbError } = await supabase.from("videos").insert([
        {
          title,
          description,
          video_url: videoFileName,
          thumbnail_url: thumbnailURL,
          views: 0,
          likes: 0,
          dislikes: 0,
        },
      ]);

      if (dbError) throw dbError;

      alert("Video berhasil diupload!");
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
    } catch (err) {
      console.error(err);
      alert("Gagal upload video!");
    }

    setLoading(false);
  };

  // ✅ Fungsi auto-generate thumbnail
  const generateThumbnail = async (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.src = URL.createObjectURL(file);
      video.currentTime = 0.1;
      video.crossOrigin = "anonymous";

      video.addEventListener("loadeddata", () => {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (blob) {
            const thumbFile = new File([blob], "thumbnail.jpg", {
              type: "image/jpeg",
            });
            resolve(thumbFile);
          }
        }, "image/jpeg");
      });
    });
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-4 border rounded shadow">
      <h1 className="text-xl font-bold mb-4">Upload Video</h1>
      <input
        type="text"
        placeholder="Judul"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      />
      <textarea
        placeholder="Deskripsi"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="border p-2 rounded w-full mb-2"
      ></textarea>

      <label className="block mb-2">
        Pilih Video:
        <input
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          className="block mt-1"
        />
      </label>

      <label className="block mb-2">
        Thumbnail (opsional):
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
          className="block mt-1"
        />
      </label>

      <button
        onClick={handleUpload}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Mengupload..." : "Upload"}
      </button>
    </div>
  );
}

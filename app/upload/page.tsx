"use client";

import { useState, DragEvent } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // ✅ Drag & Drop Handler
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("video/")) {
      setVideoFile(file);
    } else {
      alert("Hanya boleh upload file video!");
    }
  };

  // ✅ Upload Handler
  const handleUpload = async () => {
    if (!title.trim() || !videoFile) {
      alert("Judul dan video wajib diisi!");
      return;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const videoExt = videoFile.name.split(".").pop();
      const videoFileName = `${timestamp}.${videoExt}`;

      // ✅ Upload Video ke Bucket "videos"
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      // ✅ Upload Thumbnail (opsional)
      let thumbnail_url = null;
      if (thumbnailFile) {
        const thumbExt = thumbnailFile.name.split(".").pop();
        const thumbFileName = `${timestamp}.${thumbExt}`;
        const { error: thumbError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbFileName, thumbnailFile);

        if (thumbError) throw thumbError;
        thumbnail_url = thumbFileName;
      }

      // ✅ Ambil User ID (opsional, tapi di db tetap wajib kan?)
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User belum login!");

      // ✅ Simpan Metadata ke Tabel videos
      const { error: dbError } = await supabase.from("videos").insert([
        {
          title: title.trim(),
          description: description.trim(),
          video_url: videoFileName,
          thumbnail_url: thumbnail_url, // ✅ Kalau null, nanti fallback auto-generate
          user_id: user.id,
        },
      ]);

      if (dbError) throw dbError;

      alert("✅ Video berhasil diupload!");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      alert("❌ Gagal upload video: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Upload Video</h1>

      <input
        type="text"
        placeholder="Judul video"
        className="border p-2 rounded w-full mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Deskripsi video"
        className="border p-2 rounded w-full mb-3"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      {/* ✅ Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed p-6 rounded text-center mb-3 ${
          isDragging ? "border-blue-600 bg-blue-50" : "border-gray-400"
        }`}
      >
        {videoFile ? (
          <p className="text-green-600 font-semibold">{videoFile.name}</p>
        ) : (
          <p className="text-gray-500">
            Seret & taruh video di sini, atau klik di bawah untuk memilih
          </p>
        )}
      </div>
      <input
        type="file"
        accept="video/*"
        className="mb-3"
        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
      />

      {/* ✅ Thumbnail Opsional */}
      <label className="block text-sm font-semibold mb-1">
        Thumbnail (Opsional)
      </label>
      <input
        type="file"
        accept="image/*"
        className="mb-4"
        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
      />
      {thumbnailFile && (
        <p className="text-green-600 text-sm mb-3">
          ✅ Thumbnail: {thumbnailFile.name}
        </p>
      )}

      <button
        onClick={handleUpload}
        disabled={isUploading}
        className={`w-full py-2 rounded text-white ${
          isUploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isUploading ? "Mengupload..." : "Upload"}
      </button>
    </div>
  );
}

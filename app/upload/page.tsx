"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ✅ Handle drag & drop / pilih file video
  const handleVideoChange = (file: File | null) => {
    if (!file) return;
    setVideoFile(file);
    setPreviewVideo(URL.createObjectURL(file));
  };

  const handleThumbnailChange = (file: File | null) => {
    if (!file) return;
    setThumbnailFile(file);
    setPreviewThumbnail(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!title || !description || !videoFile || !thumbnailFile) {
      alert("Semua field wajib diisi!");
      return;
    }

    setUploading(true);

    try {
      // ✅ Upload Video ke bucket "videos"
      const videoFileName = `${Date.now()}-${videoFile.name}`;
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      // ✅ Upload Thumbnail ke bucket "thumbnails"
      const thumbnailFileName = `${Date.now()}-${thumbnailFile.name}`;
      const { error: thumbnailError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailFileName, thumbnailFile);

      if (thumbnailError) throw thumbnailError;

      // ✅ Simpan ke Database
      const { error: dbError } = await supabase.from("videos").insert([
        {
          title,
          description,
          video_url: videoFileName,
          thumbnail_url: thumbnailFileName,
        },
      ]);

      if (dbError) throw dbError;

      alert("Upload berhasil!");
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
      setPreviewVideo(null);
      setPreviewThumbnail(null);
    } catch (err: any) {
      alert(`Gagal upload: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>

      {/* Title */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Title</label>
        <input
          type="text"
          className="w-full border rounded p-2"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label className="block font-medium mb-1">Description</label>
        <textarea
          className="w-full border rounded p-2"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>

      {/* Drag & Drop Video */}
      <div
        className="border-2 border-dashed rounded p-4 text-center mb-3 cursor-pointer hover:bg-gray-100"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleVideoChange(e.dataTransfer.files[0]);
        }}
        onClick={() => document.getElementById("videoInput")?.click()}
      >
        {previewVideo ? (
          <video
            src={previewVideo}
            controls
            className="mx-auto rounded max-h-48"
          />
        ) : (
          <p className="text-gray-500">Drag & drop atau klik untuk pilih video</p>
        )}
        <input
          type="file"
          id="videoInput"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleVideoChange(e.target.files?.[0] || null)}
        />
      </div>

      {/* Drag & Drop Thumbnail */}
      <div
        className="border-2 border-dashed rounded p-4 text-center mb-3 cursor-pointer hover:bg-gray-100"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleThumbnailChange(e.dataTransfer.files[0]);
        }}
        onClick={() => document.getElementById("thumbnailInput")?.click()}
      >
        {previewThumbnail ? (
          <img
            src={previewThumbnail}
            alt="Thumbnail Preview"
            className="mx-auto rounded max-h-48"
          />
        ) : (
          <p className="text-gray-500">
            Drag & drop atau klik untuk pilih thumbnail (wajib)
          </p>
        )}
        <input
          type="file"
          id="thumbnailInput"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleThumbnailChange(e.target.files?.[0] || null)}
        />
      </div>

      <button
        onClick={handleUpload}
        disabled={uploading}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400"
      >
        {uploading ? "Mengupload..." : "Upload"}
      </button>
    </div>
  );
}

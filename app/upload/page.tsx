"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import { UploadCloud, ImagePlus, Video } from "lucide-react";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewVideo, setPreviewVideo] = useState<string | null>(null);
  const [previewThumbnail, setPreviewThumbnail] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null); // untuk redirect
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        if (profile) setUsername(profile.username);
      }
    };
    checkUser();
  }, []);

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
    if (!userId) {
      setMessage({ type: "error", text: "Kamu harus login dulu sebelum upload!" });
      return;
    }

    if (!title || !description || !videoFile || !thumbnailFile) {
      setMessage({ type: "error", text: "Semua field wajib diisi!" });
      return;
    }

    setUploading(true);
    setMessage(null); // reset pesan

    try {
      const videoFileName = `${Date.now()}-${videoFile.name}`;
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile);
      if (videoError) throw videoError;

      const thumbnailFileName = `${Date.now()}-${thumbnailFile.name}`;
      const { error: thumbnailError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbnailFileName, thumbnailFile);
      if (thumbnailError) throw thumbnailError;

      const { error: dbError } = await supabase.from("videos").insert([
        {
          title,
          description,
          video_url: videoFileName,
          thumbnail_url: thumbnailFileName,
          user_id: userId,
        },
      ]);
      if (dbError) throw dbError;

      setTitle("");
      setDescription("");
      setVideoFile(null);
      setThumbnailFile(null);
      setPreviewVideo(null);
      setPreviewThumbnail(null);

      setMessage({ type: "success", text: "Upload berhasil! Redirect ke profile..." });

      // Tunggu sebentar lalu redirect
      setTimeout(() => {
        if (username) router.push(`/${username}`);
      }, 700);
    } catch (err: any) {
      setMessage({ type: "error", text: `Gagal upload: ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  if (!userId) {
    return (
      <div className="max-w-2xl mx-auto p-6 mt-10 text-center bg-white shadow rounded">
        <h1 className="text-xl font-bold mb-2">Harus Login</h1>
        <p className="text-gray-600">Silakan login dulu untuk bisa upload video.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 bg-white shadow rounded">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>

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
          <video src={previewVideo} controls className="mx-auto rounded max-h-48" />
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <Video className="w-8 h-8 mb-1" />
            <p>Drag & drop atau klik untuk pilih video</p>
          </div>
        )}
        <input
          type="file"
          id="videoInput"
          accept="video/*"
          className="hidden"
          onChange={(e) => handleVideoChange(e.target.files?.[0] || null)}
        />
      </div>

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
          <img src={previewThumbnail} alt="Thumbnail Preview" className="mx-auto rounded max-h-48" />
        ) : (
          <div className="flex flex-col items-center text-gray-500">
            <ImagePlus className="w-8 h-8 mb-1" />
            <p>Drag & drop atau klik untuk pilih thumbnail (wajib)</p>
          </div>
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
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-gray-400 flex items-center justify-center gap-2 w-full"
      >
        {uploading ? (
          "Mengupload... sabar yaa emang lama banget uploadnya xD"
        ) : (
          <>
            <UploadCloud className="w-4 h-4" />
            Upload
          </>
        )}
      </button>

      {/* ✅ Pesan muncul di bawah tombol */}
      {message && (
        <div
          className={`mt-4 text-center p-2 rounded ${
            message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}

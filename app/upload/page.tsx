"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isVideo: boolean) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    handleFile(file, isVideo);
  };

  const handleFile = (file: File, isVideo: boolean) => {
    if (!file) return;
    if (isVideo) {
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
    } else {
      setThumbnailFile(file);
      setThumbPreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const token = (window as any).grecaptcha?.getResponse();
    if (!token) {
      alert("Harap centang reCAPTCHA terlebih dahulu.");
      setLoading(false);
      return;
    }

    const verifyRes = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    const verifyData = await verifyRes.json();
    if (!verifyData.success) {
      alert("Gagal validasi reCAPTCHA");
      setLoading(false);
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert("Kamu harus login.");
      setLoading(false);
      return;
    }

    const videoId = crypto.randomUUID();
    const videoExt = videoFile?.name.split(".").pop();
    const thumbExt = thumbnailFile?.name.split(".").pop();

    const videoPath = `videos/${videoId}.${videoExt}`;
    const thumbPath = `thumbnails/${videoId}.${thumbExt}`;

    const { error: videoErr } = await supabase.storage
      .from("videos")
      .upload(videoPath, videoFile!);
    if (videoErr) {
      alert("Gagal upload video.");
      setLoading(false);
      return;
    }

    const { error: thumbErr } = await supabase.storage
      .from("thumbnails")
      .upload(thumbPath, thumbnailFile!);
    if (thumbErr) {
      alert("Gagal upload thumbnail.");
      setLoading(false);
      return;
    }

    const { data: videoURL } = supabase.storage.from("videos").getPublicUrl(videoPath);
    const { data: thumbURL } = supabase.storage.from("thumbnails").getPublicUrl(thumbPath);

    const { error: insertError } = await supabase.from("videos").insert({
      id: videoId,
      user_id: user.id,
      title,
      description,
      video_url: videoURL.publicUrl,
      thumbnail_url: thumbURL.publicUrl,
    });

    if (insertError) {
      alert("Gagal menyimpan metadata ke database.");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleUpload} className="space-y-4">
        <input
          required
          type="text"
          placeholder="Judul video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full p-2 border rounded"
        />
        <textarea
          required
          placeholder="Deskripsi video"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full p-2 border rounded"
        />

        {/* Drag + Click Video */}
        <div
          onClick={() => videoInputRef.current?.click()}
          onDrop={(e) => handleDrop(e, true)}
          onDragOver={(e) => e.preventDefault()}
          className="border-dashed border-2 rounded p-4 text-center cursor-pointer"
        >
          {videoPreview ? (
            <video src={videoPreview} controls className="w-full" />
          ) : (
            "Klik atau drag & drop untuk memilih video"
          )}
          <input
            type="file"
            accept="video/*"
            ref={videoInputRef}
            hidden
            onChange={(e) => handleFile(e.target.files?.[0]!, true)}
          />
        </div>

        {/* Drag + Click Thumbnail */}
        <div
          onClick={() => thumbInputRef.current?.click()}
          onDrop={(e) => handleDrop(e, false)}
          onDragOver={(e) => e.preventDefault()}
          className="border-dashed border-2 rounded p-4 text-center cursor-pointer"
        >
          {thumbPreview ? (
            <img src={thumbPreview} alt="Thumbnail preview" className="w-full" />
          ) : (
            "Klik atau drag & drop untuk memilih thumbnail"
          )}
          <input
            type="file"
            accept="image/*"
            ref={thumbInputRef}
            hidden
            onChange={(e) => handleFile(e.target.files?.[0]!, false)}
          />
        </div>

        <div className="my-2">
          <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Mengupload..." : "Upload"}
        </button>
      </form>
    </div>
  );
}

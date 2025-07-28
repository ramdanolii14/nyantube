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
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white shadow-xl rounded-xl p-8">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Upload Video</h1>
        <form onSubmit={handleUpload} className="space-y-6">
          <div>
            <label className="block font-medium mb-1">Judul Video</label>
            <input
              required
              type="text"
              placeholder="Masukkan judul"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border rounded-md p-2 focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Deskripsi</label>
            <textarea
              required
              placeholder="Tulis deskripsi video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border rounded-md p-2 h-24 resize-none focus:outline-none focus:ring focus:ring-blue-500"
            />
          </div>

          {/* Video Upload */}
          <div>
            <label className="block font-medium mb-2">Video</label>
            <div
              onClick={() => videoInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, true)}
              onDragOver={(e) => e.preventDefault()}
              className="w-full border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-blue-400 transition"
            >
              {videoPreview ? (
                <video src={videoPreview} controls className="mx-auto w-full max-h-64 rounded-md" />
              ) : (
                <p className="text-gray-500">Klik atau drag & drop file video di sini</p>
              )}
              <input
                type="file"
                accept="video/*"
                ref={videoInputRef}
                hidden
                onChange={(e) => handleFile(e.target.files?.[0]!, true)}
              />
            </div>
          </div>

          {/* Thumbnail Upload */}
          <div>
            <label className="block font-medium mb-2">Thumbnail</label>
            <div
              onClick={() => thumbInputRef.current?.click()}
              onDrop={(e) => handleDrop(e, false)}
              onDragOver={(e) => e.preventDefault()}
              className="w-full border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:border-blue-400 transition"
            >
              {thumbPreview ? (
                <img src={thumbPreview} alt="Thumbnail" className="mx-auto w-full max-h-64 object-cover rounded-md" />
              ) : (
                <p className="text-gray-500">Klik atau drag & drop thumbnail di sini</p>
              )}
              <input
                type="file"
                accept="image/*"
                ref={thumbInputRef}
                hidden
                onChange={(e) => handleFile(e.target.files?.[0]!, false)}
              />
            </div>
          </div>

          {/* reCAPTCHA */}
          <div className="flex justify-center">
            <div className="g-recaptcha" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>
          </div>

          {/* Submit */}
          <div className="text-center">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-md transition"
            >
              {loading ? "Mengupload..." : "Upload Sekarang"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

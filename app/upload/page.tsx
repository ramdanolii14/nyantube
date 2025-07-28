"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const supabaseClient = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session?.user) {
      setError("Kamu harus login terlebih dahulu.");
      setLoading(false);
      return;
    }

    if (!videoFile || !thumbnailFile || !title || !description) {
      setError("Harap lengkapi semua field dan file.");
      setLoading(false);
      return;
    }

    // ✅ Ambil token reCAPTCHA
    const token = (window as any).grecaptcha?.getResponse();
    if (!token) {
      setError("Harap centang reCAPTCHA terlebih dahulu.");
      setLoading(false);
      return;
    }

    await handleUpload(session.user.id);
  };

  const handleUpload = async (user_id: string) => {
    if (!user_id || !videoFile || !thumbnailFile) return;

    const timestamp = Date.now();
    const videoPath = `videos/${timestamp}_${videoFile.name}`;
    const thumbnailPath = `thumbnails/${timestamp}_${thumbnailFile.name}`;

    const { data: videoData, error: videoErr } = await supabase.storage
      .from("videos")
      .upload(videoPath, videoFile);

    if (videoErr) {
      setError("Gagal upload video.");
      setLoading(false);
      return;
    }

    const { data: thumbData, error: thumbErr } = await supabase.storage
      .from("thumbnails")
      .upload(thumbnailPath, thumbnailFile);

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

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit}>
        <input
          className="w-full p-2 mb-2 border rounded"
          type="text"
          placeholder="Judul"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full p-2 mb-2 border rounded"
          placeholder="Deskripsi"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="w-full p-2 mb-2 border rounded"
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />
        <input
          className="w-full p-2 mb-4 border rounded"
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
        />

        {/* ✅ reCAPTCHA checkbox */}
        <div className="mb-4">
          <div
            className="g-recaptcha"
            data-sitekey="6LcQO5IrAAAAAGQM1ZaygBBXhbDMFyj0Wntl_H1y"
          ></div>
        </div>

        <button
          className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700 transition"
          type="submit"
          disabled={loading}
        >
          {loading ? "Mengupload..." : "Upload"}
        </button>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  );
}

"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://www.google.com/recaptcha/api.js`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    setLoading(true);

    const { data: session } = await supabase.auth.getSession();
    const user = session.session?.user;

    if (!user) {
      setError("Harus login untuk upload.");
      setLoading(false);
      return;
    }

    if (!videoFile || !thumbnailFile || !title.trim()) {
      setError("Semua field harus diisi.");
      setLoading(false);
      return;
    }

    const recaptchaResponse = (window as any).grecaptcha.getResponse();
    if (!recaptchaResponse) {
      setError("Silakan verifikasi reCAPTCHA.");
      setLoading(false);
      return;
    }

    // Upload video
    const videoExt = videoFile.name.split(".").pop();
    const videoFileName = `${Date.now()}.${videoExt}`;
    const { data: videoUpload, error: videoError } = await supabase.storage
      .from("videos")
      .upload(videoFileName, videoFile);

    if (videoError) {
      setError("Gagal upload video.");
      setLoading(false);
      return;
    }

    const { data: videoUrl } = supabase.storage.from("videos").getPublicUrl(videoFileName);

    // Upload thumbnail
    const thumbExt = thumbnailFile.name.split(".").pop();
    const thumbFileName = `${Date.now()}-thumb.${thumbExt}`;
    const { data: thumbUpload, error: thumbError } = await supabase.storage
      .from("thumbnails")
      .upload(thumbFileName, thumbnailFile);

    if (thumbError) {
      setError("Gagal upload thumbnail.");
      setLoading(false);
      return;
    }

    const { data: thumbUrl } = supabase.storage.from("thumbnails").getPublicUrl(thumbFileName);

    // Insert into table
    const { error: insertError } = await supabase.from("videos").insert({
      user_id: user.id,
      title,
      description,
      video_url: videoUrl.publicUrl,
      thumbnail_url: thumbUrl.publicUrl,
      views: 0,
      likes: 0,
      dislikes: 0,
      is_public: true,
    });

    if (insertError) {
      setError("Gagal simpan metadata video.");
      setLoading(false);
      return;
    }

    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit} id="upload-form">
        <input
          type="text"
          className="w-full mb-3 border p-2 rounded"
          placeholder="Judul Video"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full mb-3 border p-2 rounded"
          placeholder="Deskripsi Video"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <div
          onClick={() => videoInputRef.current?.click()}
          className="w-full p-4 mb-3 border-2 border-dashed text-center cursor-pointer rounded hover:bg-gray-50"
        >
          {videoFile ? (
            <p>{videoFile.name}</p>
          ) : (
            <p>📹 Klik atau drag video ke sini</p>
          )}
          <input
            type="file"
            accept="video/*"
            hidden
            ref={videoInputRef}
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />
        </div>

        <div
          onClick={() => thumbnailInputRef.current?.click()}
          className="w-full p-4 mb-3 border-2 border-dashed text-center cursor-pointer rounded hover:bg-gray-50"
        >
          {thumbnailFile ? (
            <p>{thumbnailFile.name}</p>
          ) : (
            <p>🖼️ Klik atau drag thumbnail ke sini</p>
          )}
          <input
            type="file"
            accept="image/*"
            hidden
            ref={thumbnailInputRef}
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="g-recaptcha mb-3" data-sitekey="6LcQO5IrAAAAAGQM1ZaygBBXhbDMFyj0Wntl_H1y" data-size="invisible"></div>

        <button
          type="submit"
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Mengupload..." : "Upload"}
        </button>

        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
      </form>
    </div>
  );
}

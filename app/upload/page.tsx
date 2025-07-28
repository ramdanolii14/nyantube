"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '@/supabase/client';

const supabase = createClient();

export default function UploadPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLInputElement>(null);
  const thumbnailRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadReCAPTCHA = () => {
      const script = document.createElement("script");
      script.src = `https://www.google.com/recaptcha/api.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      document.body.appendChild(script);
    };
    loadReCAPTCHA();
  }, []);

  const handleUpload = async () => {
    if (!videoRef.current?.files?.[0]) return alert("Pilih video");
    if (!thumbnailRef.current?.files?.[0]) return alert("Pilih thumbnail");
    if (!title) return alert("Isi judul");

    setLoading(true);

    // 1. Get reCAPTCHA token
    const token = await new Promise<string>((resolve) => {
      window.grecaptcha.ready(() => {
        window.grecaptcha
          .execute(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!, { action: "upload" })
          .then(resolve);
      });
    });

    // 2. Verify reCAPTCHA on server
    const recaptchaRes = await fetch("/api/verify-recaptcha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const recaptchaJson = await recaptchaRes.json();
    if (!recaptchaJson.success) {
      setLoading(false);
      return alert("Gagal upload: Gagal validasi reCAPTCHA.");
    }

    // 3. Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return alert("Harus login untuk upload.");
    }

    // 4. Upload video
    const videoFile = videoRef.current.files[0];
    const videoExt = videoFile.name.split(".").pop();
    const videoPath = `videos/${Date.now()}.${videoExt}`;
    const { data: videoUpload, error: videoError } = await supabase.storage
      .from("videos")
      .upload(videoPath, videoFile);
    if (videoError) {
      setLoading(false);
      return alert("Gagal upload video.");
    }

    // 5. Upload thumbnail
    const thumbnailFile = thumbnailRef.current.files[0];
    const thumbExt = thumbnailFile.name.split(".").pop();
    const thumbPath = `thumbnails/${Date.now()}.${thumbExt}`;
    const { data: thumbUpload, error: thumbError } = await supabase.storage
      .from("thumbnails")
      .upload(thumbPath, thumbnailFile);
    if (thumbError) {
      setLoading(false);
      return alert("Gagal upload thumbnail.");
    }

    // 6. Insert to database
    const { error: insertError } = await supabase.from("videos").insert({
      user_id: user.id,
      title,
      description,
      video_url: videoUpload.path,
      thumbnail_url: thumbUpload.path,
      is_public: isPublic,
    });

    setLoading(false);
    if (insertError) return alert("Gagal menyimpan metadata video.");
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Judul</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Deskripsi</label>
        <textarea
          className="w-full border px-3 py-2 rounded"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Video</label>
        <input type="file" accept="video/*" ref={videoRef} />
      </div>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Thumbnail</label>
        <input type="file" accept="image/*" ref={thumbnailRef} />
      </div>

      <div className="mb-4">
        <label className="inline-flex items-center">
          <input
            type="checkbox"
            className="mr-2"
            checked={isPublic}
            onChange={() => setIsPublic(!isPublic)}
          />
          Publik
        </label>
      </div>

      <button
        onClick={handleUpload}
        disabled={loading}
        className={`bg-blue-600 text-white px-4 py-2 rounded ${loading ? "opacity-50" : ""}`}
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}

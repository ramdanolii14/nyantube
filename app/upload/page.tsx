"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/supabase/client";
import { v4 as uuidv4 } from "uuid";

declare global {
  interface Window {
    grecaptcha: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SITE_KEY = "6Lc1vXMlAAAAADuHeQ4QvqqdrEPZlHzSDIQSLl8C"; // ganti kalau perlu

export default function UploadPage() {
  const supabase = createClient();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (!videoFile || !thumbnailFile) {
      setError("Harap unggah video dan thumbnail.");
      return;
    }

    setLoading(true);

    try {
      const token = await window.grecaptcha.execute(RECAPTCHA_SITE_KEY, {
        action: "submit",
      });

      if (!token) {
        setError("Silakan verifikasi reCAPTCHA.");
        setLoading(false);
        return;
      }

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        setError("Kamu belum login.");
        setLoading(false);
        return;
      }

      const videoId = uuidv4();
      const fileExt = videoFile.name.split(".").pop();
      const thumbnailExt = thumbnailFile.name.split(".").pop();

      const videoPath = `${user.id}/${videoId}.${fileExt}`;
      const thumbPath = `${user.id}/${videoId}.${thumbnailExt}`;

      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoPath, videoFile);
      if (videoError) throw videoError;

      const { error: thumbError } = await supabase.storage
        .from("thumbnails")
        .upload(thumbPath, thumbnailFile);
      if (thumbError) throw thumbError;

      const { data: videoURL } = supabase.storage
        .from("videos")
        .getPublicUrl(videoPath);

      const { data: thumbnailURL } = supabase.storage
        .from("thumbnails")
        .getPublicUrl(thumbPath);

      const { error: insertError } = await supabase.from("videos").insert({
        id: videoId,
        user_id: user.id,
        title,
        description,
        video_url: videoURL.publicUrl,
        thumbnail_url: thumbnailURL.publicUrl,
        views: 0,
        likes: 0,
        dislikes: 0,
        is_public: true,
      });

      if (insertError) throw insertError;

      router.push("/");

    } catch (err: any) {
      console.error(err);
      setError("Terjadi kesalahan saat upload.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.grecaptcha) {
      window.grecaptcha.ready(() => {
        console.log("reCAPTCHA ready");
      });
    }
  }, []);

  return (
    <div className="max-w-md mx-auto p-4">
      <input
        type="text"
        className="w-full border mb-2 px-3 py-2"
        placeholder="Judul video"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full border mb-2 px-3 py-2"
        placeholder="Deskripsi"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      ></textarea>
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        className="w-full border mb-2 px-3 py-2"
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
        className="w-full border mb-2 px-3 py-2"
      />
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-red-600 text-white w-full py-2 rounded hover:bg-red-700 transition"
      >
        {loading ? "Mengupload..." : "Upload"}
      </button>
      {error && <p className="text-red-600 mt-2 text-sm">{error}</p>}
    </div>
  );
}

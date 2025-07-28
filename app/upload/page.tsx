"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";

export default function UploadPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  const generateId = () => `${Date.now()}-${Math.floor(Math.random() * 1e9)}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Kamu belum login.");
      setLoading(false);
      return;
    }

    if (!title || !description || !videoFile || !thumbnailFile) {
      setError("Semua field wajib diisi!");
      setLoading(false);
      return;
    }

    const token = (window as any).grecaptcha.getResponse();
    if (!token) {
      setError("Silakan verifikasi reCAPTCHA.");
      setLoading(false);
      return;
    }

    try {
      const id = generateId();
      const videoName = `${id}-${videoFile.name}`;
      const thumbName = `${id}-${thumbnailFile.name}`;

      const { error: vErr } = await supabase.storage
        .from("videos")
        .upload(videoName, videoFile);
      if (vErr) throw vErr;

      const { error: tErr } = await supabase.storage
        .from("thumbnails")
        .upload(thumbName, thumbnailFile);
      if (tErr) throw tErr;

      const { data: videoUrl } = supabase.storage.from("videos").getPublicUrl(videoName);
      const { data: thumbUrl } = supabase.storage.from("thumbnails").getPublicUrl(thumbName);

      const { error: dbErr } = await supabase.from("videos").insert({
        user_id: user.id,
        title,
        description,
        video_url: videoUrl.publicUrl,
        thumbnail_url: thumbUrl.publicUrl,
      });
      if (dbErr) throw dbErr;

      router.push("/");
    } catch (err: any) {
      console.error(err);
      setError("Gagal upload: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow mt-10">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          className="w-full mb-3 border p-2 rounded"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          className="w-full mb-3 border p-2 rounded"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        <div
          className="border-2 border-dashed rounded p-4 mb-3 text-center cursor-pointer hover:bg-gray-50"
          onClick={() => document.getElementById("videoInput")?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setVideoFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {videoFile ? <p>{videoFile.name}</p> : <p>Drag & drop atau klik untuk pilih video</p>}
          <input
            id="videoInput"
            type="file"
            accept="video/*"
            hidden
            onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
          />
        </div>

        <div
          className="border-2 border-dashed rounded p-4 mb-3 text-center cursor-pointer hover:bg-gray-50"
          onClick={() => document.getElementById("thumbnailInput")?.click()}
          onDrop={(e) => {
            e.preventDefault();
            setThumbnailFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {thumbnailFile ? <p>{thumbnailFile.name}</p> : <p>Drag & drop atau klik untuk pilih thumbnail</p>}
          <input
            id="thumbnailInput"
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="g-recaptcha mb-3" data-sitekey="6LcQO5IrAAAAAGQM1ZaygBBXhbDMFyj0Wntl_H1y" data-size="invisible"></div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "Mengupload..." : "Upload"}
        </button>

        {error && <p className="text-red-600 mt-3 text-sm">{error}</p>}
      </form>
    </div>
  );
}

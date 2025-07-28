"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function UploadPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDrop = (e: React.DragEvent, type: "video" | "thumbnail") => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (type === "video") {
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
      } else {
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "video" | "thumbnail") => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "video") {
        setVideoFile(file);
        setVideoPreview(URL.createObjectURL(file));
      } else {
        setThumbnailFile(file);
        setThumbnailPreview(URL.createObjectURL(file));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    const token = (window as any).grecaptcha?.getResponse();
    if (!token) {
      alert("Gagal upload: Gagal validasi reCAPTCHA");
      setLoading(false);
      return;
    }

    const verify = await fetch("/api/verify-recaptcha", {
      method: "POST",
      body: JSON.stringify({ token }),
    });

    const result = await verify.json();
    if (!result.success) {
      alert("Gagal upload: Gagal validasi reCAPTCHA");
      setLoading(false);
      return;
    }

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) {
      alert("Kamu harus login untuk upload.");
      setLoading(false);
      return;
    }

    const id = uuidv4();

    let videoUrl = "";
    let thumbnailUrl = "";

    if (videoFile) {
      const { data, error } = await supabase.storage
        .from("videos")
        .upload(`videos/${id}`, videoFile);
      if (error) {
        alert("Gagal upload video.");
        setLoading(false);
        return;
      }
      videoUrl = `https://txtcdwwrpusmmbvoimkq.supabase.co/storage/v1/object/public/videos/${data.path}`;
    }

    if (thumbnailFile) {
      const { data, error } = await supabase.storage
        .from("thumbnails")
        .upload(`thumbnails/${id}`, thumbnailFile);
      if (error) {
        alert("Gagal upload thumbnail.");
        setLoading(false);
        return;
      }
      thumbnailUrl = `https://txtcdwwrpusmmbvoimkq.supabase.co/storage/v1/object/public/thumbnails/${data.path}`;
    }

    const { error } = await supabase.from("videos").insert([
      {
        id,
        user_id: user.id,
        title,
        description,
        video_url: videoUrl,
        thumbnail_url: thumbnailUrl,
        is_public: true, // default
      },
    ]);

    if (error) {
      alert("Gagal menyimpan metadata video.");
      setLoading(false);
      return;
    }

    (window as any).grecaptcha?.reset();
    router.push("/");
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Judul"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border p-2 mb-4"
        />

        <textarea
          placeholder="Deskripsi"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full border p-2 mb-4"
        />

        <div
          onDrop={(e) => handleDrop(e, "video")}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed p-4 text-center mb-4"
        >
          <p>Drag & drop video atau klik untuk memilih</p>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => handleFileChange(e, "video")}
            className="mt-2"
          />
        </div>

        {videoPreview && (
          <video controls className="w-full mb-4">
            <source src={videoPreview} />
            Your browser does not support the video tag.
          </video>
        )}

        <div
          onDrop={(e) => handleDrop(e, "thumbnail")}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed p-4 text-center mb-4"
        >
          <p>Drag & drop thumbnail atau klik untuk memilih</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, "thumbnail")}
            className="mt-2"
          />
        </div>

        {thumbnailPreview && (
          <img src={thumbnailPreview} alt="Thumbnail preview" className="w-full mb-4" />
        )}

        <div className="g-recaptcha mb-4" data-sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY}></div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? "Mengupload..." : "Upload"}
        </button>
      </form>
    </div>
  );
}

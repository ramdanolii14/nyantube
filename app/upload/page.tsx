"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async () => {
    if (!title.trim() || !videoFile) {
      alert("Judul dan video wajib diisi!");
      return;
    }

    setIsUploading(true);

    try {
      const timestamp = Date.now();
      const ext = videoFile.name.split(".").pop();
      const videoFileName = `${timestamp}.${ext}`;

      // ✅ Upload Video ke Bucket "videos"
      const { error: videoError } = await supabase.storage
        .from("videos")
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      // ✅ Generate Thumbnail (AUTO pakai fetchFrame API serverless kamu nanti)
      const thumbnailFileName = `${timestamp}.jpg`;
      let thumbnail_url = thumbnailFileName;

      // Kamu bisa skip thumbnail jika nggak mau auto-generate
      // Untuk sementara langsung default
      // const thumbnail_url = "/default-thumbnail.jpg";

      // ✅ Ambil User ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User belum login!");

      // ✅ Simpan Metadata ke Database
      const { error: dbError } = await supabase.from("videos").insert([
        {
          title: title.trim(),
          description: description.trim(),
          video_url: videoFileName,
          thumbnail_url,
          user_id: user.id,
        },
      ]);

      if (dbError) throw dbError;

      alert("✅ Video berhasil diupload!");
      router.push("/");
    } catch (err: any) {
      console.error(err);
      alert("❌ Gagal upload video: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-16 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4">Upload Video</h1>

      <input
        type="text"
        placeholder="Judul video"
        className="border p-2 rounded w-full mb-3"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <textarea
        placeholder="Deskripsi video"
        className="border p-2 rounded w-full mb-3"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />

      <input
        type="file"
        accept="video/*"
        className="mb-3"
        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
      />

      <button
        onClick={handleUpload}
        disabled={isUploading}
        className={`w-full py-2 rounded text-white ${
          isUploading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {isUploading ? "Mengupload..." : "Upload"}
      </button>
    </div>
  );
}

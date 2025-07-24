"use client";

import { useState } from "react";
import { createClient } from "@/supabase/client";

export default function UploadPage() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [finalThumbnail, setFinalThumbnail] = useState<File | null>(null);

  const supabase = createClient();

  async function generateThumbnailFromVideo(video: File): Promise<File> {
    return new Promise((resolve) => {
      const videoElement = document.createElement("video");
      videoElement.src = URL.createObjectURL(video);
      videoElement.currentTime = 1; // ambil frame di detik ke-1

      videoElement.addEventListener("loadeddata", () => {
        const canvas = document.createElement("canvas");
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const file = new File([blob], "auto-thumbnail.jpg", { type: "image/jpeg" });
          resolve(file);
        }, "image/jpeg");
      });
    });
  }

  async function handleUpload() {
    if (!videoFile) {
      alert("Upload video dulu!");
      return;
    }

    let thumbnailToUpload = finalThumbnail;

    // ✅ Auto-generate thumbnail kalau user nggak upload
    if (!thumbnailToUpload) {
      thumbnailToUpload = await generateThumbnailFromVideo(videoFile);
    }

    const random = Math.floor(Math.random() * 1000);
    const thumbExt = thumbnailToUpload.name.split(".").pop();
    const thumbnailName = `${Date.now()}-${random}.${thumbExt}`;

    // ✅ Upload thumbnail ke Supabase Storage
    const { error: thumbError } = await supabase.storage
      .from("thumbnails")
      .upload(thumbnailName, thumbnailToUpload);

    if (thumbError) {
      console.error(thumbError);
      alert("Gagal upload thumbnail!");
      return;
    }

    alert("Upload sukses!");
  }

  return (
    <div className="p-6">
      <input
        type="file"
        accept="video/*"
        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFinalThumbnail(e.target.files?.[0] || null)}
      />
      <button
        onClick={handleUpload}
        className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Upload
      </button>
    </div>
  );
}

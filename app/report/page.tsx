"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/supabase/client";

export default function ReportPage() {
  const [videoUrl, setVideoUrl] = useState("");
  const [reason, setReason] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    fetchUser();
  }, []);

  const handleReport = async () => {
    if (!userId) return setMessage("❌ Anda harus login untuk mengirim laporan");
    if (!videoUrl.trim() || !reason.trim()) return setMessage("❌ Lengkapi semua kolom");

    const { error } = await supabase.from("reports").insert([
      {
        user_id: userId,
        video_url: videoUrl.trim(),
        reason: reason.trim(),
      },
    ]);

    if (error) {
      console.error("REPORT ERROR:", error);
      setMessage("❌ Gagal mengirim laporan. Coba lagi.");
    } else {
      setVideoUrl("");
      setReason("");
      setMessage("✅ Laporan berhasil dikirim!");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-5 bg-white shadow rounded">
      <h1 className="text-xl font-bold mb-4">Laporkan Video</h1>

      {message && (
        <div className="mb-3 text-sm font-semibold text-center text-gray-600">{message}</div>
      )}

      <input
        type="text"
        placeholder="Link Video"
        value={videoUrl}
        onChange={(e) => setVideoUrl(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />

      <textarea
        placeholder="Alasan laporan..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="w-full border p-2 rounded mb-3"
      />

      <button
        onClick={handleReport}
        className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 w-full"
      >
        Kirim Laporan
      </button>
    </div>
  );
}

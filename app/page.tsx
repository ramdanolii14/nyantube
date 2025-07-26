"use client";

import Navbar from "@/app/components/Navbar";
import VideoList from "@/app/components/VideoList";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ✅ Navbar di paling atas */}
      <Navbar />

      <main className="max-w-6xl mx-auto pt-24 px-4">
        <h1 className="text-2xl font-bold mb-6">Beranda</h1>

        {/* ✅ VideoList menampilkan semua video */}
        <VideoList />
      </main>
    </div>
  );
}

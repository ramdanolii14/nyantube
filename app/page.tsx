"use client";

import Navbar from "@/app/components/Navbar";
import VideoList from "@/app/components/VideoList";

export default function Page() {
  return (
    <main className="bg-gray-100 min-h-screen">

      <div className="container mx-auto px-4 py-6">
        <VideoList />
      </div>
    </main>
  );
}

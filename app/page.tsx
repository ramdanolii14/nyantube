"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Navbar from "@/app/components/Navbar";
import VideoList from "@/app/components/VideoList";

export default function HomePage() {
  const [isBanned, setIsBanned] = useState<boolean | null>(null);

  useEffect(() => {
    const checkBanStatus = async () => {
      const { data: auth } = await supabase.auth.getUser();
      const user = auth.user;

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_banned")
          .eq("id", user.id)
          .single();

        if (profile?.is_banned) {
          setIsBanned(true);
          await supabase.auth.signOut();
        } else {
          setIsBanned(false);
        }
      } else {
        setIsBanned(false);
      }
    };

    checkBanStatus();
  }, []);

  if (isBanned === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (isBanned) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-100">
        <div className="bg-white p-6 rounded shadow text-center">
          <h1 className="text-xl font-bold text-red-600 mb-2">Akun Diblokir</h1>
          <p className="text-gray-700">Akun Anda telah di-banned dan tidak dapat mengakses project ini.</p>
          <p className="text-gray-700">Appeal: dev@ramdan.fun</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-6xl mx-auto pt-24 px-4">
        <h1 className="text-2xl font-bold mb-6">Beranda</h1>
        <VideoList />
      </main>
    </div>
  );
}

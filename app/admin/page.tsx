"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";

interface Report {
  id: string;
  video_id: string;
  reporter_id: string;
  reason: string;
  status: string;
  created_at: string;
  videos?: {
    video_url: string;
  };
}

interface Account {
  id: string;
  username: string;
  avatar_url: string | null;
  banned: boolean;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"reports" | "accounts">("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // ✅ Ambil data laporan beserta video_url
  const fetchReports = async () => {
    const { data, error } = await supabase
      .from("reports")
      .select("id, video_id, reporter_id, reason, status, created_at, videos(video_url)")
      .order("created_at", { ascending: false });
    if (error) console.error("FETCH REPORTS ERROR:", error);
    else setReports(data as Report[]);
  };

  // ✅ Ambil daftar akun
  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, banned");
    if (error) console.error("FETCH ACCOUNTS ERROR:", error);
    else setAccounts(data as Account[]);
  };

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = "/";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        alert("🚫 Anda tidak memiliki akses ke halaman admin.");
        window.location.href = "/";
      }
    };

    checkAdmin();
    fetchReports();
    fetchAccounts();
  }, []);

  // ✅ Tangani laporan (terima/tolak)
  const handleReportAction = async (reportId: string, status: "accepted" | "rejected") => {
    const { error } = await supabase
      .from("reports")
      .update({ status })
      .eq("id", reportId);
    if (error) {
      console.error("UPDATE REPORT ERROR:", error);
    } else {
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status } : r
        )
      );
      alert(`✅ Laporan berhasil ditandai sebagai ${status}`);
    }
  };

  // ✅ Hapus video langsung dari panel admin
  const handleDeleteVideo = async (videoId: string, videoUrl: string) => {
    const confirmDelete = confirm("Yakin ingin menghapus video ini?");
    if (!confirmDelete) return;

    try {
      const fileName = videoUrl.split("/").pop() || videoUrl;

      const { error: storageError } = await supabase
        .storage
        .from("videos")
        .remove([fileName]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (dbError) throw dbError;

      alert("✅ Video dihapus.");
      fetchReports();
    } catch (err) {
      console.error("DELETE VIDEO ERROR:", err);
      alert("❌ Gagal menghapus video.");
    }
  };

  // ✅ Ban / Unban akun
  const handleBan = async (userId: string, banned: boolean) => {
    try {
      if (banned) {
        await supabase.from("profiles").update({
          username: "deleted_user",
          banned
        }).eq("id", userId);

        const { data: userVideos } = await supabase
          .from("videos")
          .select("id, video_url, thumbnail_url")
          .eq("user_id", userId);

        if (userVideos) {
          for (const vid of userVideos) {
            if (vid.video_url) {
              await supabase.storage.from("videos").remove([vid.video_url]);
            }
            if (vid.thumbnail_url) {
              await supabase.storage.from("thumbnails").remove([vid.thumbnail_url]);
            }
          }
          await supabase.from("videos").delete().eq("user_id", userId);
        }
      } else {
        await supabase.from("profiles").update({ banned }).eq("id", userId);
      }

      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === userId ? { ...acc, banned, username: banned ? "deleted_user" : acc.username } : acc
        )
      );

      alert(banned ? "✅ Akun berhasil diban" : "✅ Akun berhasil di-unban");
    } catch (err) {
      console.error("BAN ERROR:", err);
    }
  };

  const filteredAccounts = accounts.filter((acc) =>
    acc.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto mt-20 p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>

      {/* ✅ Tab Menu */}
      <div className="flex gap-3 mb-5">
        <button
          onClick={() => setActiveTab("reports")}
          className={`px-4 py-2 rounded ${activeTab === "reports" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Laporan
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`px-4 py-2 rounded ${activeTab === "accounts" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
        >
          Daftar Akun
        </button>
      </div>

      {/* ✅ TAB LAPORAN */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <p className="text-gray-500">Belum ada laporan.</p>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="border p-3 rounded"
              >
                <p className="font-bold">
                  Video:{" "}
                  <Link
                    href={`/watch/${report.video_id}`}
                    className="text-blue-600 underline"
                  >
                    Lihat Video
                  </Link>
                </p>
                <p className="text-sm text-gray-600">Alasan: {report.reason}</p>
                <p className="text-xs text-gray-400">
                  Status: {report.status || "pending"}
                </p>
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleReportAction(report.id, "accepted")}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Terima
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, "rejected")}
                    className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  >
                    Tolak
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteVideo(report.video_id, report.videos?.video_url || "")
                    }
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Hapus Video
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ✅ TAB DAFTAR AKUN */}
      {activeTab === "accounts" && (
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Cari username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border p-2 rounded w-full mb-3"
          />
          {filteredAccounts.length === 0 ? (
            <p className="text-gray-500">Tidak ada akun ditemukan.</p>
          ) : (
            filteredAccounts.map((acc) => (
              <div
                key={acc.id}
                className="border p-3 rounded flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Image
                    src={
                      acc.avatar_url
                        ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${acc.avatar_url}`
                        : "/default-avatar.jpg"
                    }
                    alt={acc.username}
                    width={40}
                    height={40}
                    className="rounded-full"
                    unoptimized
                  />
                  <div>
                    <p className="font-bold">{acc.username || "Tanpa Nama"}</p>
                    <p className="text-xs text-gray-500">{acc.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleBan(acc.id, !acc.banned)}
                  className={`px-3 py-1 rounded ${
                    acc.banned ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  }`}
                >
                  {acc.banned ? "Unban" : "Ban"}
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

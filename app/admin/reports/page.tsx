"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";
import Link from "next/link";

interface Report {
  id: string;
  reporter_id: string;
  video_id: string;
  video_link: string;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  profiles?: {
    username: string;
  };
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const fetchAdminAndReports = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ Cek apakah user adalah admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();

      if (user.email === "admin@nyantube.com") {
        setAdmin(true);
      } else {
        setAdmin(false);
        return;
      }

      // ✅ Ambil laporan
      const { data, error } = await supabase
        .from("reports")
        .select("id, reporter_id, video_id, video_link, reason, description, status, created_at, reviewed_at, profiles(username)")
        .order("created_at", { ascending: false });

      if (!error && data) {
        setReports(data as Report[]);
      }
      setLoading(false);
    };

    fetchAdminAndReports();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: newStatus, reviewed_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      setReports((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, status: newStatus, reviewed_at: new Date().toISOString() } : r
        )
      );
    } catch (err) {
      console.error("UPDATE STATUS ERROR:", err);
    }
  };

  if (!admin)
    return (
      <div className="text-center mt-20">
        ❌ Anda tidak memiliki akses ke halaman ini.
      </div>
    );

  if (loading) return <p className="text-center mt-20">Loading laporan...</p>;

  return (
    <div className="max-w-5xl mx-auto mt-20 bg-white shadow-md p-5 rounded-md">
      <h1 className="text-2xl font-bold mb-4">Daftar Laporan Video</h1>
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-100 text-left">
            <th className="border p-2">Reporter</th>
            <th className="border p-2">Video</th>
            <th className="border p-2">Alasan</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="border p-2">{r.profiles?.username || r.reporter_id}</td>
              <td className="border p-2">
                <Link
                  href={r.video_link}
                  className="text-blue-600 hover:underline"
                  target="_blank"
                >
                  {r.video_id}
                </Link>
              </td>
              <td className="border p-2">{r.reason}</td>
              <td className="border p-2">
                <span
                  className={`px-2 py-1 rounded text-white ${
                    r.status === "pending"
                      ? "bg-yellow-500"
                      : r.status === "reviewed"
                      ? "bg-blue-500"
                      : "bg-green-600"
                  }`}
                >
                  {r.status}
                </span>
              </td>
              <td className="border p-2 flex gap-2">
                {r.status !== "reviewed" && (
                  <button
                    onClick={() => updateStatus(r.id, "reviewed")}
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                  >
                    Tandai Ditinjau
                  </button>
                )}
                {r.status !== "resolved" && (
                  <button
                    onClick={() => updateStatus(r.id, "resolved")}
                    className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700"
                  >
                    Tandai Selesai
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

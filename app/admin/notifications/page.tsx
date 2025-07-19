"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

async function checkAdmin(user_id: string) {
  const { data } = await supabase
    .from("admin")
    .select("user_id")
    .eq("user_id", user_id)
    .maybeSingle();
  return !!data;
}

export default function AdminNotifications() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAdmin = async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return (window.location.href = "/");
      const isAdmin = await checkAdmin(user.id);
      if (!isAdmin) return (window.location.href = "/");
      fetchReports();
    };

    verifyAdmin();
  }, []);

  const fetchReports = async () => {
    const { data } = await supabase
      .from("reports")
      .select("*, videos(title)")
      .order("created_at", { ascending: false });
    setReports(data || []);
    setLoading(false);
  };

  if (loading) return <p className="mt-6 text-center">Loading...</p>;

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Laporan User</h1>
      {reports.length === 0 ? (
        <p>Tidak ada report.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li key={r.id} className="p-3 border rounded bg-white">
              <p className="font-semibold">{r.videos.title}</p>
              <p className="text-sm text-gray-500">{r.reason}</p>
              <p className="text-xs text-gray-400">{r.created_at}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

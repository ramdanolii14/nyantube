"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/supabase/client";

export default function NotificationDropdown({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotifications(data || []));
  }, []);

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>🔔</button>
      {open && (
        <div className="absolute right-0 mt-2 bg-white border rounded shadow p-2 w-60 max-h-64 overflow-auto">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">Kosong nih...</p>
          ) : (
            notifications.map((n) => (
              <p key={n.id} className="text-sm border-b p-1">{n.message}</p>
            ))

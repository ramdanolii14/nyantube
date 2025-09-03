"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setMessage("❌ Password dan konfirmasi tidak sama.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Password berhasil diperbarui! Silakan login lagi.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form
        onSubmit={handleReset}
        className="space-y-4 max-w-md w-full mx-auto p-6 bg-white rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold text-center text-red-600">
          Reset Password
        </h1>

        <input
          type="password"
          placeholder="Password baru"
          className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Konfirmasi password baru"
          className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 text-white w-full py-2 rounded-md hover:bg-red-700 transition disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan Password Baru"}
        </button>

        {message && (
          <p className="text-center text-sm text-gray-600">{message}</p>
        )}
      </form>
    </div>
  );
}

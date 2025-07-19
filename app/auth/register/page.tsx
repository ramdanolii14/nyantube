"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [channelName, setChannelName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // Buat akun
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("Gagal mendapatkan userId.");

      // Insert ke profiles (RLS HARUS diubah dulu di SQL)
      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: userId,
          username,
          channel_name: channelName,
        },
      ]);

      if (profileError) throw profileError;

      setMessage("✅ Pendaftaran berhasil! Cek email untuk verifikasi.");
      setTimeout(() => router.push("/auth/login"), 2000);
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleRegister}
        className="bg-white p-6 rounded-md shadow w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-red-600">
          Daftar Akun
        </h1>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="border p-2 rounded-md w-full mb-3"
          required
        />
        <input
          type="text"
          placeholder="Nama Channel"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          className="border p-2 rounded-md w-full mb-3"
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 rounded-md w-full mb-3"
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 rounded-md w-full mb-4"
          required
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 text-white w-full py-2 rounded-md hover:bg-red-700"
        >
          {loading ? "Mendaftar..." : "Daftar"}
        </button>

        {message && (
          <p className="text-center text-sm text-gray-600 mt-3">{message}</p>
        )}
      </form>
    </div>
  );
}

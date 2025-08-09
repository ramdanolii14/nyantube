"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";

function generateUsername() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `nyan_${code}`;
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== password2) {
      setMessage("❌ Password tidak sama.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Daftar user di Supabase Auth
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setMessage("❌ Gagal mendapatkan data user setelah pendaftaran.");
        setLoading(false);
        return;
      }

      const userId = data.user.id;
      const username = generateUsername();

      // Simpan profil ke tabel profiles dengan username otomatis
      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        email,
        username,
        channel_name: username, // agar channel_name juga terisi, sama dengan username
        avatar_url: null,
      });

      if (profileError) {
        setMessage(`❌ Gagal menyimpan profil: ${profileError.message}`);
        setLoading(false);
        return;
      }

      setMessage("✅ Pendaftaran berhasil! Cek email untuk verifikasi.");

      // Reset form
      setEmail("");
      setPassword("");
      setPassword2("");
    } catch {
      setMessage("❌ Terjadi kesalahan saat proses pendaftaran.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4 max-w-md mx-auto p-4 bg-white rounded-md shadow-md">
      <h1 className="text-2xl font-bold text-center text-red-600">Daftar Nyantube</h1>

      <input
        type="email"
        placeholder="Email"
        className="border p-2 rounded-md w-full"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 rounded-md w-full"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Konfirmasi Password"
        className="border p-2 rounded-md w-full"
        value={password2}
        onChange={(e) => setPassword2(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-red-600 text-white w-full py-2 rounded-md hover:bg-red-700 transition"
      >
        {loading ? "Mendaftar..." : "Daftar"}
      </button>

      {message && <p className="text-center text-sm text-gray-600">{message}</p>}
    </form>
  );
}

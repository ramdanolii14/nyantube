"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";

function generateUsername() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "nyan_" + code;
}

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");

    if (password !== password2) {
      setMessage("❌ Password dan konfirmasi password harus sama.");
      return;
    }

    setLoading(true);

    try {
      // Sign up user di Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setMessage(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setMessage("❌ Gagal mendapatkan data user setelah registrasi.");
        setLoading(false);
        return;
      }

      // Generate username otomatis
      const username = generateUsername();

      // Insert profile ke tabel profiles
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        username,
        channel_name: username, // kalau mau beda bisa diubah nanti
        avatar_url: null,
      });

      if (upsertError) {
        setMessage(`❌ Gagal menyimpan profil: ${upsertError.message}`);
        setLoading(false);
        return;
      }

      setMessage("✅ Pendaftaran berhasil! Cek email untuk verifikasi.");
      setEmail("");
      setPassword("");
      setPassword2("");
    } catch {
      setMessage("❌ Terjadi kesalahan saat proses pendaftaran.");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleRegister}
      className="space-y-4 max-w-md mx-auto bg-white p-6 rounded-lg shadow-md"
    >
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

"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== password2) {
      setMessage("❌ Password tidak sama.");
      return;
    }

    if (!captchaToken) {
      setMessage("❌ Silakan selesaikan verifikasi CAPTCHA.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/get-ip");
      const data = await res.json();
      const ip = data?.ip_address;

      if (!ip) {
        setMessage("❌ Gagal mendapatkan IP.");
        setLoading(false);
        return;
      }

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

      const { count, error: countError } = await supabase
        .from("ip_registers")
        .select("id", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", startOfMonth)
        .lte("created_at", endOfMonth);

      if (countError) {
        console.error(countError);
        setMessage("❌ Terjadi kesalahan saat memeriksa IP.");
        setLoading(false);
        return;
      }

      if (count !== null && count >= 2) {
        setMessage("❌ IP ini sudah mencapai batas 2 akun dalam bulan ini.");
        setLoading(false);
        return;
      }

      const { error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: { captchaToken },
      });

      if (signupError) {
        setMessage(`❌ ${signupError.message}`);
        setLoading(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("ip_registers")
        .insert([{ ip_address: ip }]);

      if (insertError) {
        console.error(insertError);
        setMessage("⚠️ Akun dibuat, tapi gagal menyimpan IP.");
      } else {
        setMessage("✅ Pendaftaran berhasil! Cek email untuk verifikasi.");
      }

      setEmail("");
      setPassword("");
      setPassword2("");
      setCaptchaToken(null);
    } catch (err) {
      console.error(err);
      setMessage("❌ Terjadi kesalahan tak terduga.");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleRegister}
      className="space-y-6 max-w-md mx-auto p-8 bg-white rounded-2xl shadow-md"
    >
      <h1 className="text-3xl font-bold text-center text-red-600 mb-4">
        Daftar Akun Dulu..
      </h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          type="email"
          placeholder="contoh@gmail.com"
          className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          type="password"
          placeholder="Minimal 6 karakter"
          className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Konfirmasi Password</label>
        <input
          type="password"
          placeholder="Ulangi password"
          className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-center">
        <Turnstile
          siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => setCaptchaToken(token)}
          options={{ theme: "light" }}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-red-600 text-white w-full py-3 rounded-lg font-medium hover:bg-red-700 transition disabled:opacity-60"
      >
        {loading ? "Mendaftar..." : "Daftar"}
      </button>

      {message && <p className="text-center text-sm font-medium text-gray-700">{message}</p>}
    </form>
  );
}

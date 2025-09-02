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

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { captchaToken },
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
      setLoading(false);
      return;
    }

    setMessage("✅ Pendaftaran berhasil! Cek email untuk verifikasi.");
    setEmail("");
    setPassword("");
    setPassword2("");
    setCaptchaToken(null);
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleRegister}
      className="space-y-6 max-w-md mx-auto p-8 bg-white rounded-2xl shadow-md"
    >
      <h1 className="text-3xl font-bold text-center text-red-600 mb-4">
        Daftar Nyantube
      </h1>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          placeholder="contoh@email.com"
          className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Password
        </label>
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
        <label className="block text-sm font-medium text-gray-700">
          Konfirmasi Password
        </label>
        <input
          type="password"
          placeholder="Ulangi password"
          className="border p-3 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          required
        />
      </div>

      {/* Widget turnstile dari cloudpeler beta test wak*/}
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

      {message && (
        <p className="text-center text-sm font-medium text-gray-700">
          {message}
        </p>
      )}
    </form>
  );
}

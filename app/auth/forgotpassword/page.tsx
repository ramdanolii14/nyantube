"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { Turnstile } from "@marsidev/react-turnstile";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setMessage("❌ Silakan selesaikan verifikasi CAPTCHA.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      captchaToken, // nambah captcha, kelupaan wak aowkaowkokw
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Link reset password sudah dikirim ke email kamu!");
    }

    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleResetPassword}
        className="space-y-4 w-full max-w-md p-6 bg-white rounded-xl shadow"
      >
        <h1 className="text-2xl font-bold text-center text-red-600">
          Lupa Password bang?
        </h1>

        <input
          type="email"
          placeholder="Masukkan email kamu"
          className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

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
          className="bg-red-600 text-white w-full py-2 rounded-md hover:bg-red-700 transition disabled:opacity-60"
        >
          {loading ? "Mengirim..." : "Kirim Link Reset"}
        </button>

        {message && (
          <p className="text-center text-sm text-gray-600">{message}</p>
        )}
      </form>
    </div>
  );
}

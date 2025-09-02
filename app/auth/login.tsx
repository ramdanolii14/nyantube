"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setMessage("❌ eitss... CAPTCHA dulu bos.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken },
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Login berhasil!");
      router.push("/");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4 max-w-md mx-auto p-6 bg-white rounded-xl shadow">
      <h1 className="text-2xl font-bold text-center text-red-600">
        Nyanstream Login
      </h1>

      <input
        type="email"
        placeholder="Email"
        className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-400"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <input
        type="password"
        placeholder="Password"
        className="border p-2 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-red-400"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {/* Turnstile widget dari cloudpeler */}
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
        {loading ? "Login..." : "Login"}
      </button>

      {message && (
        <p className="text-center text-sm text-gray-600">{message}</p>
      )}
    </form>
  );
}

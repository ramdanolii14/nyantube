"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleAuth = async () => {
    setLoading(true);
    setMessage("");

    try {
      // Ambil IP dari API kamu
      const ipRes = await fetch("/api/get-ip");
      const { ip } = await ipRes.json();

      if (mode === "register") {
        // Cek limit IP di Supabase
        const { count, error: countError } = await supabase
          .from("ip_registers")
          .select("id", { count: "exact", head: true })
          .eq("ip_address", ip);

        if (countError) throw countError;
        if (count && count >= 2) {
          setMessage("❌ IP ini sudah memiliki 2 akun.");
          setLoading(false);
          return;
        }

        // Buat akun
        const { data: signUpData, error: signUpError } =
          await supabase.auth.signUp({ email, password });
        if (signUpError) throw signUpError;

        const userId = signUpData.user?.id;
        if (!userId) throw new Error("Gagal membuat user.");

        // Insert ke ip_registers
        const { error: ipError } = await supabase.from("ip_registers").insert({
          id: crypto.randomUUID(),
          ip_address: ip,
          created_at: new Date().toISOString()
        });
        if (ipError) throw ipError;

        // Insert ke profiles
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: userId,
          username,
          channel_name: username,
          avatar_url: avatarUrl,
          created_at: new Date().toISOString()
        });
        if (profileError) throw profileError;

        setMessage("✅ Registrasi berhasil!");
      }

      if (mode === "login") {
        const { error: signInError } =
          await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;

        setMessage("✅ Login berhasil!");
      }
    } catch (err: any) {
      setMessage(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 400, margin: "auto" }}>
      <h1>{mode === "register" ? "Register" : "Login"}</h1>

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ display: "block", marginBottom: 10, width: "100%" }}
      />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={{ display: "block", marginBottom: 10, width: "100%" }}
      />

      {mode === "register" && (
        <>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ display: "block", marginBottom: 10, width: "100%" }}
          />
          <input
            placeholder="Avatar URL"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            style={{ display: "block", marginBottom: 10, width: "100%" }}
          />
        </>
      )}

      <button onClick={handleAuth} disabled={loading} style={{ width: "100%" }}>
        {loading
          ? "Memproses..."
          : mode === "register"
          ? "Daftar"
          : "Masuk"}
      </button>

      <p style={{ marginTop: 10, color: "red" }}>{message}</p>

      <p style={{ marginTop: 20 }}>
        {mode === "register" ? (
          <>
            Sudah punya akun?{" "}
            <button onClick={() => setMode("login")}>Login</button>
          </>
        ) : (
          <>
            Belum punya akun?{" "}
            <button onClick={() => setMode("register")}>Register</button>
          </>
        )}
      </p>
    </div>
  );
}

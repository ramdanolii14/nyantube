"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Image from "next/image";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  email: string;
}

interface Profile {
  id: string;
  username: string;
  email: string;
  channel_name: string;
  avatar_url: string | null;
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [channelName, setChannelName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email! });
        fetchProfile(data.user.id);
      }
    });
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!error && data) setProfile(data);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !channelName.trim()) {
      setMessage("❌ Username dan Nama Channel wajib diisi.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("/api/get-ip");
      const { ip } = await res.json();

      const today = new Date().toISOString().split("T")[0];
      const { count, error: countError } = await supabase
        .from("ip_registers")
        .select("*", { count: "exact", head: true })
        .eq("ip_address", ip)
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lt("created_at", `${today}T23:59:59.999Z`);

      if (countError) {
        setMessage("❌ Gagal memeriksa IP.");
        setLoading(false);
        return;
      }

      if ((count ?? 0) >= 5) {
        setMessage(
          "❌ Batas pendaftaran harian dari IP ini sudah tercapai (maks 5 akun per hari)."
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(`❌ ${error.message}`);
      } else if (data.user) {
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id, // pastikan ID user ikut diinsert
            email: email;
            username,
            channel_name: channelName,
          });

        await supabase.from("ip_registers").insert({
          ip_address: ip,
        });

        setMessage("✅ Pendaftaran berhasil! Cek email untuk verifikasi.");
        setMode("login");
        setUsername("");
        setChannelName("");
      }
    } catch (err) {
      setMessage("❌ Terjadi kesalahan saat proses pendaftaran.");
    }

    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(`❌ ${error.message}`);
    } else {
      setMessage("✅ Login berhasil!");
      setUser({ id: data.user!.id, email: data.user!.email! });
      fetchProfile(data.user!.id);
      router.push("/");
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setEmail("");
    setPassword("");
    setUsername("");
    setChannelName("");
    setMessage("");
  };

  if (user && profile) {
    const avatarUrl = profile.avatar_url
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
      : `https://ui-avatars.com/api/?name=${profile.username}`;

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full text-center">
          <Image
            src={avatarUrl}
            alt="Avatar"
            width={80}
            height={80}
            className="rounded-full mx-auto mb-3"
            unoptimized
          />
          <h1 className="text-2xl font-bold mb-2">
            Selamat Datang, {profile.channel_name || "User"}
          </h1>
          <p className="text-gray-700">
            <strong>@{profile.username}</strong>
          </p>
          <p className="text-gray-600">{user.email}</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white w-full py-2 rounded-md hover:bg-red-700 mt-4"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={mode === "login" ? handleLogin : handleRegister}
        className="bg-white p-6 rounded-lg shadow-md max-w-md w-full"
      >
        <h1 className="text-2xl font-bold mb-4 text-center text-red-600">
          {mode === "login" ? "Login Nyantube" : "Daftar Nyantube"}
        </h1>

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

        {mode === "register" && (
          <>
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
              className="border p-2 rounded-md w-full mb-4"
              required
            />
          </>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-red-600 text-white w-full py-2 rounded-md hover:bg-red-700 transition"
        >
          {loading
            ? mode === "login"
              ? "Login..."
              : "Mendaftar..."
            : mode === "login"
            ? "Login"
            : "Daftar"}
        </button>

        {message && (
          <p className="text-center text-sm text-gray-600 mt-3">{message}</p>
        )}

        <p
          onClick={() => setMode(mode === "login" ? "register" : "login")}
          className="text-center text-blue-600 text-sm mt-3 cursor-pointer"
        >
          {mode === "login"
            ? "Belum punya akun? Daftar di sini"
            : "Sudah punya akun? Login di sini"}
        </p>
      </form>
    </div>
  );
}


"use client";

import { useState } from "react";
import { supabase } from "@/supabase/client";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [username, setUsername] = useState("");
  const [channelName, setChannelName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const uploadAvatar = async (userId: string) => {
    if (!avatarFile) return null;

    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${userId}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile, {
        cacheControl: "3600",
        upsert: true,
        contentType: avatarFile.type,
      });

    if (uploadError) {
      throw uploadError;
    }
    return filePath;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !channelName.trim()) {
      setMessage("❌ Username dan Nama Channel wajib diisi.");
      return;
    }

    if (password !== password2) {
      setMessage("❌ Password tidak sama.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      // Daftar user auth
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        setMessage(`❌ ${error.message}`);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setMessage("❌ Gagal mendapatkan data user.");
        setLoading(false);
        return;
      }

      // Upload avatar jika ada
      let avatar_url: string | null = null;
      if (avatarFile) {
        try {
          avatar_url = await uploadAvatar(data.user.id);
        } catch (err) {
          setMessage("❌ Gagal upload avatar.");
          setLoading(false);
          return;
        }
      }

      // Simpan profil ke tabel profiles
      const { error: upsertError } = await supabase.from("profiles").upsert({
        id: data.user.id,
        email,
        username,
        channel_name: channelName,
        avatar_url,
      });

      if (upsertError) {
        setMessage(`❌ Gagal menyimpan profil: ${upsertError.message}`);
        setLoading(false);
        return;
      }

      setMessage("✅ Pendaftaran berhasil! Cek email untuk verifikasi.");
      // reset form
      setEmail("");
      setPassword("");
      setPassword2("");
      setUsername("");
      setChannelName("");
      setAvatarFile(null);
    } catch (err) {
      setMessage("❌ Terjadi kesalahan saat proses pendaftaran.");
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleRegister} className="space-y-4">
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

      <input
        type="text"
        placeholder="Username"
        className="border p-2 rounded-md w-full"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />

      <input
        type="text"
        placeholder="Nama Channel"
        className="border p-2 rounded-md w-full"
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}
        required
      />

      <div>
        <label className="block mb-1 font-medium">Upload Avatar (opsional)</label>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {avatarFile && <p className="text-sm mt-1">{avatarFile.name}</p>}
      </div>

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

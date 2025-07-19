"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";

export default function EditProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [channelName, setChannelName] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (data) {
        setUsername(data.username);
        setChannelName(data.channel_name);
        if (data.avatar_url) {
          setPreviewAvatar(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${data.avatar_url}`
          );
        }
      }
    };

    const checkPermission = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || user.id !== id) {
        // ✅ Kalau bukan pemilik profile, langsung diarahkan ke halaman profile
        router.push(`/profile/${id}`);
      }
    };

    checkPermission();
    fetchProfile();
  }, [id, router]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatar(file);
      setPreviewAvatar(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      let avatarUrl = null;
      if (avatar) {
        const fileName = `avatars-${Date.now()}-${avatar.name}`;
        const { data, error } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatar, {
            cacheControl: "3600",
            upsert: true,
          });
        if (error) throw error;
        avatarUrl = data.path;
      }

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          username,
          channel_name: channelName,
          ...(avatarUrl && { avatar_url: avatarUrl }),
        })
        .eq("id", id);
      if (updateError) throw updateError;

      router.push(`/profile/${id}`);
    } catch (err: any) {
      console.error("UPLOAD AVATAR ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-4 border rounded-md shadow">
      <h1 className="text-xl font-bold mb-4">Edit Profile</h1>

      <div className="mb-4 flex flex-col items-center">
        <Image
          src={previewAvatar || "https://ui-avatars.com/api/?name=${profile.username}"}
          alt="Preview Avatar"
          width={100}
          height={100}
          className="rounded-full mb-2"
          unoptimized
        />
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={handleAvatarChange}
        />
      </div>

      <input
        type="text"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
        className="border p-2 w-full mb-3 rounded"
      />

      <input
        type="text"
        value={channelName}
        onChange={(e) => setChannelName(e.target.value)}
        placeholder="Nama Channel"
        className="border p-2 w-full mb-3 rounded"
      />

      <button
        onClick={handleSaveProfile}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700"
      >
        {loading ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </div>
  );
}

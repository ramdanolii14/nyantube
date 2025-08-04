import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/supabase/client";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head"; // ✅ Tambah ini

interface Profile {
  id: string;
  username: string;
  channel_name: string;
  avatar_url: string | null;
  is_verified?: boolean;
  is_mod?: boolean;
  created_at: string; // ✅ Tambah ini
}

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  views: number;
  created_at: string;
}

export async function generateMetadata({ params }: { params: { username: string } }) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, channel_name, avatar_url, created_at")
    .eq("username", params.username)
    .single();

  if (!profile) {
    return {
      title: "Profil tidak ditemukan - Nyantube",
    };
  }

  const { data: videos } = await supabase
    .from("videos")
    .select("id")
    .eq("user_id", profile.id);

  const avatarUrl = profile.avatar_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : `https://ui-avatars.com/api/?name=${profile.username}`;

  return {
    title: `${profile.channel_name} - Nyantube`,
    openGraph: {
      title: profile.channel_name,
      description: `@${profile.username} • ${videos?.length || 0} video • Bergabung sejak ${new Date(
        profile.created_at
      ).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })}`,
      url: `https://nyantube.ramdan.fun/${profile.username}`,
      images: [avatarUrl],
      type: "profile",
    },
    twitter: {
      card: "summary",
      title: profile.channel_name,
      description: `@${profile.username} • ${videos?.length || 0} video`,
      images: [avatarUrl],
    },
  };
}

export default function PublicProfilePage() {
  const { username } = useParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, username, channel_name, avatar_url, is_verified, is_mod, created_at") // ✅ Ambil created_at
        .eq("username", username)
        .single();
      if (data) setProfile(data as Profile);
    };

    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };

    const init = async () => {
      await fetchUser();
      await fetchProfile();
    };

    init();
  }, [username]);

  const fetchVideos = async (user_id: string) => {
    const { data } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, views, created_at")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false });

    if (data) setVideos(data as Video[]);
  };

  useEffect(() => {
    if (profile?.id) {
      fetchVideos(profile.id);
    }
  }, [profile]);

  const handleDeleteVideo = async (videoId: string) => {
    const confirmDelete = confirm("Yakin ingin menghapus video ini?");
    if (!confirmDelete) return;

    const { error } = await supabase.from("videos").delete().eq("id", videoId);
    if (!error) {
      setVideos((prev) => prev.filter((v) => v.id !== videoId));
      alert("Video berhasil dihapus!");
    } else {
      alert("Gagal menghapus video!");
    }
  };

  if (!profile) return <p className="text-center mt-10">Loading profile...</p>;

  const avatarUrl = profile.avatar_url
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_url}`
    : `https://ui-avatars.com/api/?name=${profile.username}`;

  return (
    <>
      {/* ✅ Meta tags khusus untuk Discord & sosial media */}
      <Head>
        <title>{profile.channel_name} - Nyantube</title>
        <meta property="og:title" content={profile.channel_name} />
        <meta
          property="og:description"
          content={@${profile.username} • ${videos.length} video • Bergabung sejak ${new Date(
            profile.created_at
          ).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}}
        />
        <meta property="og:image" content={avatarUrl} />
        <meta
          property="og:url"
          content={https://nyantube.ramdan.fun/${profile.username}}
        />
        <meta property="og:type" content="profile" />

        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={profile.channel_name} />
        <meta
          name="twitter:description"
          content={`@${profile.username} • ${videos.length} video`}
        />
        <meta name="twitter:image" content={avatarUrl} />
      </Head>

      <div className="max-w-5xl mx-auto mt-20 px-4">
        {/* ✅ Profile Header */}
        <div className="flex items-center gap-4">
          {/* ✅ Foto Profile */}
          <div className="w-20 h-20 rounded-full overflow-hidden border">
            <Image
              src={avatarUrl}
              alt={profile.username}
              width={80}
              height={80}
              className="object-cover w-full h-full"
              unoptimized
            />
          </div>

          <div>
            <h1 className="text-2xl font-bold flex items-center gap-1">
              {profile.channel_name}
              {profile.is_verified && (
                <div className="relative group inline-block">
                  <Image
                    src="/verified.svg"
                    alt="verified"
                    width={16}
                    height={16}
                    className="inline-block align-middle"
                  />
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                    VERIFIED USER
                  </div>
                </div>
              )}
              {profile.is_mod && (
                <div className="relative group inline-block">
                  <Image
                    src="/mod.svg"
                    alt="verified"
                    width={16}
                    height={16}
                    className="inline-block align-middle"
                  />
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1 hidden group-hover:block bg-black text-white text-[10px] px-2 py-1 rounded whitespace-nowrap max-w-[200px] overflow-hidden text-ellipsis">
                    VERIFIED ADMIN
                  </div>
                </div>
              )}
            </h1>
            <p className="text-gray-500">@{profile.username}</p>
          </div>

          {/* ✅ Tombol Edit */}
          {userId === profile.id && (
            <Link
              href={`/profile/${profile.id}/edit`}
              className="ml-auto bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
            >
              Edit Profile
            </Link>
          )}
        </div>

        <hr className="my-5" />

        {/* ✅ Video List */}
        <h2 className="text-xl font-bold mb-3">
          Video dari {profile.channel_name}
        </h2>
        {videos.length === 0 ? (
          <p className="text-gray-500">Belum ada video diunggah.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((v) => (
              <div
                key={v.id}
                className="border rounded-md overflow-hidden hover:shadow-md transition relative group"
              >
                <Link href={`/watch/${v.id}`}>
                  <Image
                    src={
                      v.thumbnail_url
                        ? ${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/thumbnails/${v.thumbnail_url}
                        : "/default-thumbnail.jpg"
                    }
                    alt={v.title}
                    width={400}
                    height={225}
                    className="w-full h-40 object-cover"
                    unoptimized
                  />
                  <div className="p-2">
                    <h3 className="font-semibold text-sm line-clamp-2">
                      {v.title}
                    </h3>
                    <p className="text-xs text-gray-500">{v.views} views</p>
                  </div>
                </Link>

                {userId === profile.id && (
                  <button
                    onClick={() => handleDeleteVideo(v.id)}
                    className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                    title="Hapus Video"
                  >
                    🗑
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}


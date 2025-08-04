import { supabase } from "@/supabase/server"; // pastikan ini server-side client
import PublicProfilePage from "./PublicProfile";

export async function generateMetadata({ params }: { params: { username: string } }) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, channel_name, avatar_url, created_at")
    .eq("username", params.username)
    .single();

  if (!profile) {
    return { title: "Profil tidak ditemukan - Nyantube" };
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
      ).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
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

export default function Page({ params }: { params: { username: string } }) {
  return <PublicProfilePage username={params.username} />;
}

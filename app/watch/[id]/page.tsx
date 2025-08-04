import { supabase } from "@/supabase/client";
import WatchPageClient from "./WatchPageClient";

export const revalidate = 0;

interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  channel_name?: string;
  is_verified?: boolean;
  is_mod?: boolean;
}

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  profiles: Profile;
}

export default async function WatchPage({ params }: { params: { id: string } }) {
  const { id } = params;

  // Ambil data video + creator
  const { data: videoData } = await supabase
    .from("videos")
    .select("*, profiles(id, username, avatar_url, channel_name, is_verified, is_mod)")
    .eq("id", id)
    .single();

  if (!videoData) {
    return <p className="text-center mt-10">Video not found</p>;
  }

  // Mapping supaya aman kalau null
  const video: Video = {
    ...videoData,
    profiles: videoData.profiles
      ? {
          id: videoData.profiles.id,
          username: videoData.profiles.username,
          avatar_url: videoData.profiles.avatar_url,
          channel_name: videoData.profiles.channel_name,
          is_verified: videoData.profiles.is_verified,
          is_mod: videoData.profiles.is_mod,
        }
      : {
          id: "",
          username: "Unknown",
          avatar_url: null,
          channel_name: "",
          is_verified: false,
          is_mod: false,
        },
  };

  return <WatchPageClient video={video} />;
}

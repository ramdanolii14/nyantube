import Link from "next/link";
import { supabase } from "@/supabase/client";

export default function VideoCard({ video }: { video: any }) {
  return (
    <Link href={`/videos/${video.id}`} className="block">
      <div className="rounded overflow-hidden shadow hover:shadow-lg transition">
        <video src={video.video_url} className="w-full h-32 object-cover" />
        <div className="p-2">
          <p className="font-semibold text-sm">{video.title}</p>
          <p className="text-xs text-gray-500">{video.views} views</p>
        </div>
      </div>
    </Link>
  );
}

"use client";

export interface Video {
  id: string;
  user_id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  views: number;
  created_at: string;
  is_public: boolean;
  likes: number;
  dislikes: number;
}

export default function VideoList({ videos }: { videos: Video[] }) {
  if (!videos.length) return <p>Antara emang sunyi atau database error T-T</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div key={video.id} className="border rounded-lg overflow-hidden shadow">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="w-full h-40 object-cover"
          />
          <div className="p-2">
            <h2 className="font-semibold text-sm">{video.title}</h2>
            <p className="text-xs text-gray-500">{video.views} views</p>
          </div>
        </div>
      ))}
    </div>
  );
}

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
  if (!videos || videos.length === 0) {
    return <p className="text-center text-gray-500">No videos found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {videos.map((video) => (
        <div key={video.id} className="bg-white rounded shadow p-2">
          <img
            src={video.thumbnail_url}
            alt={video.title}
            className="rounded mb-2"
          />
          <h2 className="font-bold">{video.title}</h2>
          <p className="text-sm text-gray-600">{video.views} views</p>
        </div>
      ))}
    </div>
  );
}

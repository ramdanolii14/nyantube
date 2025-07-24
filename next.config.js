/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ui-avatars.com",
      },
      {
        protocol: "https",
        hostname: "txtcdwwrpusmmbvoimkq.supabase.co", // kalau ada avatar dari supabase
      },
      {
        protocol: "https",
        hostname: "rais2gather.fun",
      },
    ],
  },
};

module.exports = nextConfig;

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
        hostname: "txtcdwwrpusmmbvoimkq.supabase.co",
      },
      {
        protocol: "https",
        hostname: "rais2gather.fun",
      },
    ],
  },
  async headers() {
    const securityHeaders = [
      {
        key: 'Content-Security-Policy',
        value:
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src * blob: data:; media-src *; connect-src *",
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff',
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN',
      },
      {
        key: 'Referrer-Policy',
        value: 'strict-origin-when-cross-origin',
      },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
    ];

    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;

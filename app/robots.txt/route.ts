export async function GET() {
  const baseUrl = "https://nyantube.ramdan.fun";

  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
Sitemap: ${baseUrl}/video-sitemap.xml
`,
    {
      headers: { "Content-Type": "text/plain" },
    }
  );
}

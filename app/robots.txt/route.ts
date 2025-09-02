export async function GET() {
  const baseUrl = "https://www.nyanstream.my.id";

  return new Response(
    `User-agent: *
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`,
    {
      headers: { "Content-Type": "text/plain" },
    }
  );
}

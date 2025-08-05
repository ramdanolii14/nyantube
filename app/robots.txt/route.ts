export async function GET() {
  const baseUrl = "https://nyanstream.ramdan.fun";

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

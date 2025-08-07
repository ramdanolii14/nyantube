export function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString.replace(" ", "T"));

  console.log("⏰ NOW:", now.toISOString());
  console.log("📅 PAST:", past.toISOString());
  console.log("🕒 Selisih detik:", Math.floor((now.getTime() - past.getTime()) / 1000));

  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

  return past.toLocaleDateString();
}

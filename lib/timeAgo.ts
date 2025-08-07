export function timeAgo(dateString: string): string {
  const now = new Date();
  const pastUTC = new Date(dateString);

  // Konversi waktu UTC ke waktu lokal browser
  const past = new Date(
    pastUTC.getTime() + now.getTimezoneOffset() * 60 * 1000 * -1
  );

  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

  return past.toLocaleDateString();
}

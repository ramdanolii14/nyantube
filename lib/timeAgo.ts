export function timeAgo(dateString: string): string {
  const now = new Date();
  const past = new Date(dateString);

  // Sesuaikan zona waktu lokal (misalnya GMT+8 untuk Indonesia)
  const timezoneOffsetMs = now.getTimezoneOffset() * 60 * 1000;
  const adjustedPast = new Date(past.getTime() + timezoneOffsetMs);

  const seconds = Math.floor((now.getTime() - adjustedPast.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;

  return adjustedPast.toLocaleDateString();
}

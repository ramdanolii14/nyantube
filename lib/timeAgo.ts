export function timeAgo(dateString: string) {
  console.log("⏳ dateString:", dateString);
  
  if (!dateString || typeof dateString !== "string") {
    return "Invalid date";
  }

  const past = new Date(dateString.replace(" ", "T"));
  if (isNaN(past.getTime())) {
    return "Invalid date";
  }

  const now = new Date();
  const seconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;

  return past.toLocaleDateString();
}


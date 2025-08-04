import WatchPageClient from "./WatchPageClient";

export default function WatchPage({ params }: { params: { id: string } }) {
  return <WatchPageClient id={params.id} />;
}

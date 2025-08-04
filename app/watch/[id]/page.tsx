import WatchPageClient from "./WatchPageClient";

export default function Page({ params }: { params: { id: string } }) {
  return <WatchPageClient id={params.id} />;
}

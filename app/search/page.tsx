import { Suspense } from "react";
import dynamic from "next/dynamic";

const SearchClient = dynamic(() => import("./SearchClient"), {
  ssr: false,
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchClient />
    </Suspense>
  );
}

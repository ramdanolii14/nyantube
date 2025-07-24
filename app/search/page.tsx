import { Suspense } from "react";
import dynamic from "next/dynamic";

const SearchClient = dynamic(() => import("./SearchClient"), {
  ssr: false,
});

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default function Page() {
  return (
    <Suspense fallback={<p className="mt-20 text-center">Loading...</p>}>
      <SearchClient />
    </Suspense>
  );
}

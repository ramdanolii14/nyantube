import { Suspense } from "react";
import dynamic from "next/dynamic";

const SearchClient = dynamic(() => import("./SearchClient"), {
  ssr: false,
});

export const dynamicParams = true;
export const fetchCache = "force-no-store";
export const revalidate = 0;

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4 text-center">Loading...</p>}>
      <SearchClient />
    </Suspense>
  );
}

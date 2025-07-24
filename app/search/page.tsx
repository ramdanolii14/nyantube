import { Suspense } from "react";
import dynamicImport from "next/dynamic";

const SearchClient = dynamicImport(() => import("./SearchClient"), {
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<p className="mt-20 text-center">Loading...</p>}>
      <SearchClient />
    </Suspense>
  );
}

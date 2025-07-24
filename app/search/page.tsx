import { Suspense } from "react";
import nextDynamic from "next/dynamic"; // ✅ GANTI NAMA BIAR NGGAK TABRAKAN

const SearchClient = nextDynamic(() => import("./SearchClient"), {
  ssr: false,
});

export const dynamic = "force-dynamic"; // ✅ SEKARANG AMAN
export const fetchCache = "force-no-store";

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchClient />
    </Suspense>
  );
}

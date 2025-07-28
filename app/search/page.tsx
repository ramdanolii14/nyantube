// app/search/page.tsx
import { Suspense } from "react";
import SearchClient from "./SearchClient";

export default function SearchPage() {
  return (
    <div className="p-4">
      <Suspense fallback={<p>Loading search...</p>}>
        <SearchClient />
      </Suspense>
    </div>
  );
}

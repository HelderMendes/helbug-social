"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { Loader2 } from "lucide-react";

export default function SearchSection({ query, type, renderItem }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery({
      queryKey: ["search", type, query],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get("/api/search", {
            searchParams: {
              q: query,
              type,
              ...(pageParam ? { cursor: pageParam } : {}),
            },
          })

          .json(),
      initialPageParam: null as string | null,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    });

  const items = data?.pages.flatMap((p) => p.results) || [];

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold capitalize">{type}</h2>
      {status === "pending" && <p>Loading...</p>}
      {status === "success" && !items.length && <p>No {type} found</p>}
      <div className="space-y-4">{items.map((item) => renderItem(item))}</div>
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-3 rounded bg-primary px-4 py-2 text-white"
        >
          {isFetchingNextPage ? (
            <Loader2 className="animate-spin" />
          ) : (
            "Load more"
          )}
        </button>
      )}
    </div>
  );
}

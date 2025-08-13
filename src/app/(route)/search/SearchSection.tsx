"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import kyInstance from "@/lib/ky";
import { Loader2 } from "lucide-react";

interface SearchSectionProps {
  query: string;
  type: string;
  renderItem: (item: any) => React.ReactNode;
}

interface SearchResponse {
  results: any[];
  nextCursor: string | null;
}

export default function SearchSection({
  query,
  type,
  renderItem,
}: SearchSectionProps) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useInfiniteQuery<SearchResponse>({
      queryKey: ["search", type, query],
      queryFn: ({ pageParam }) =>
        kyInstance
          .get("/api/search", {
            searchParams: {
              q: query,
              type,
              ...(pageParam ? { cursor: pageParam as string } : {}),
            },
          })
          .json<SearchResponse>(),
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

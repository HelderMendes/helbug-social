import TrendsSidebar from "@/components/TrendsSidebar";
import { Metadata } from "next";
import React from "react";
import SearchResults from "./SearchResults";

interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] : q;
  return {
    title: query ? `Search results for "${query}"` : "Search",
    description: "Search for content across the platform",
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? q[0] : q;

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 gap-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="line-clamp-2 break-all text-center text-2xl font-bold">
            Search Results for {query ? `"${query}"` : "... search"}
          </h1>
          <p className="text-ellipsis pt-3 text-center text-primary">
            There are {query?.length} elements founded
          </p>
        </div>
        {query && <SearchResults query={query} />}
      </div>
      <TrendsSidebar />
    </main>
  );
}

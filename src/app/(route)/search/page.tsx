import { validateRequest } from "@/auth";
import TrendsSidebar from "@/components/TrendsSidebar";
import { redirect } from "next/navigation";
import SearchResults from "./SearchResults";

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { q } = await searchParams;
  const { user } = await validateRequest();

  if (!user) redirect("/login");

  return (
    <main className="flex w-full min-w-0 gap-5">
      <div className="w-full min-w-0 space-y-5">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <h1 className="text-2xl font-bold">
            {q ? `Search results for "${q}"` : "Search"}
          </h1>
        </div>
        {q && <SearchResults query={q} />}
      </div>
      <TrendsSidebar />
    </main>
  );
}

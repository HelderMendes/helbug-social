"use client";

import { useRouter } from "next/navigation";
import { Input } from "./ui/input";
import { SearchIcon } from "lucide-react";

const SearchField = () => {
  const router = useRouter();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    //Get the value from the input field
    const form = e.currentTarget;
    const q = (form.q as HTMLInputElement).value.trim(); //trim the white spaces (user can't send an empty value)

    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    // Progressive enhancement – form will work also with disable javascript using method and action
    <form onSubmit={handleSubmit} method="GET" action="/search">
      <div className="relative">
        <Input name="q" placeholder="Search" className="pe-10" />
        <SearchIcon className="absolute right-3 top-1/2 size-5 -translate-y-1/2 transform text-muted-foreground" />
      </div>
    </form>
  );
};

export default SearchField;

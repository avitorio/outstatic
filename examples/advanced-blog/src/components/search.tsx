"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { Input } from "./ui/input";

export default function Search() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }

    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Input
      placeholder="Search..."
      onChange={(event) => handleSearch(event.target.value)}
      defaultValue={searchParams.get("q"?.toString()) || ""}
    />
  );
}

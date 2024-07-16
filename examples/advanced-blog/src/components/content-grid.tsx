"use client";

import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { OstDocument } from "outstatic";
import Search from "./search";
import metadb from "@/../outstatic/content/metadata.json";
import { Suspense } from "react";

type Item = {
  tags?: { value: string; label: string }[];
} & OstDocument;

type Props = {
  collection: string;
  title?: string;
  items: Item[] | typeof metadb.metadata;
  priority?: boolean;
  viewAll?: boolean;
  search?: boolean;
};

const ContentGrid = ({
  title = "More",
  items,
  collection,
  priority = false,
  viewAll = false,
  search = false,
}: Props) => {
  const searchParams = useSearchParams();

  const searchQuery = searchParams.get("q")?.toLowerCase();
  const posts = metadb.metadata;
  const searchResults: typeof metadb.metadata = [];

  if (searchQuery) {
    posts.forEach((post) => {
      if (post.status === "published" && post.collection === collection) {
        if (
          post.title.toLowerCase().includes(searchQuery) ||
          post.description.toLowerCase().includes(searchQuery)
        ) {
          searchResults.push(post);
        }
      }
    });
  }
  return (
    <section id={collection} className="mb-24">
      <div className="flex gap-4 md:gap-6 items-end">
        <h2 className="text-4xl md:text-6xl font-bold tracking-tighter leading-tight capitalize">
          {title}
        </h2>
        {viewAll ? (
          <Button asChild variant="outline" className="hidden md:flex">
            <Link href={`/${collection}`} className="gap-2">
              View all <ArrowRight size={16} />
            </Link>
          </Button>
        ) : null}
      </div>

      <div className="my-8">{search ? <Search /> : null}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 sm:gap-x-6 lg:gap-x-8 gap-y-5 sm:gap-y-6 lg:gap-y-8 mt-4 md:mt-8">
        {(searchResults.length > 0 ? searchResults : items).map((item, id) => (
          <Link key={item.slug} href={`/${collection}/${item.slug}`}>
            <div className="cursor-pointer border rounded-md md:w-full scale-100 hover:scale-[1.02] active:scale-[0.97] motion-safe:transform-gpu transition duration-100 motion-reduce:hover:scale-100 hover:shadow overflow-hidden h-full">
              <Image
                src={item.coverImage || `/api/og?title=${item.title}`}
                alt=""
                className="border-b md:h-[180px] object-cover object-center"
                width={430}
                height={180}
                sizes="(min-width: 768px) 347px, 192px"
                priority={priority && id <= 2}
              />
              <div className="p-4">
                {Array.isArray(item?.tags)
                  ? item.tags.map(({ label }) => (
                      <span
                        key={label}
                        className="inline-block bg-gray-200 rounded-full px-2 py-0 text-sm font-semibold text-gray-700 mr-2 mb-4"
                      >
                        {label}
                      </span>
                    ))
                  : null}
                <h3 className="text-xl mb-2 leading-snug font-bold hover:underline">
                  {item.title}
                </h3>
                <div className="text-md mb-4 text-slate-700"></div>
                <p className="text-md leading-relaxed mb-4">
                  {item.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {viewAll ? (
        <Button asChild variant="secondary" className="md:hidden w-full mt-4">
          <Link href={`/${collection}`} className="gap-2">
            View all {title}
            <ArrowRight size={16} />
          </Link>
        </Button>
      ) : null}
    </section>
  );
};

function ContentGridWrapper(props: Props) {
  return (
    <Suspense>
      <ContentGrid {...props} />
    </Suspense>
  );
}

export default ContentGridWrapper;

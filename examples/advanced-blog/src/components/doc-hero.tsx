import Image from "next/image";
import { OstDocument } from "outstatic";
import DateFormatter from "./date-formatter";

type Doc = {
  tags: { value: string; label: string }[];
} & OstDocument;

export default function DocHero(doc: Doc) {
  return (
    <>
      <div className="relative mb-2 md:mb-4 sm:mx-0 w-full h-52 md:h-96">
        <Image
          alt={doc.title}
          src={doc.coverImage || `/api/og?title=${doc.title}`}
          fill
          className="object-cover object-center rounded-md border"
          priority
        />
      </div>
      {Array.isArray(doc?.tags)
        ? doc.tags.map(({ label }) => (
            <span
              key={label}
              className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2 mt-4"
            >
              {label}
            </span>
          ))
        : null}
      <h1 className="font-primary text-2xl font-bold md:text-4xl mb-2">
        {doc.title}
      </h1>
      <div className="hidden md:block md:mb-12 text-slate-600 dark:text-slate-400">
        Written on <DateFormatter dateString={doc.publishedAt} /> by{" "}
        {doc?.author?.name || ""}.
      </div>
      <hr className="border-gray-200 mt-10 mb-10" />
    </>
  );
}

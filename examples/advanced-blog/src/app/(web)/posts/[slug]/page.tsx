import DocHero from "@/components/doc-hero";
import MDXComponent from "@/components/mdx/mdx-component";
import MDXServer from "@/lib/mdx-server";
import { absoluteUrl, ogUrl } from "@/lib/utils";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { OstDocument } from "outstatic";
import { getDocumentSlugs, load } from "outstatic/server";

type Post = {
  tags: { value: string; label: string }[];
} & OstDocument;

interface Params {
  params: {
    slug: string;
  };
}

export async function generateMetadata(params: Params): Promise<Metadata> {
  const post = await getData(params);

  if (!post) {
    return {};
  }

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: absoluteUrl(`/posts/${post.slug}`),
      images: [
        {
          url: ogUrl(post?.coverImage || `/api/og?title=${post.title}`),
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ogUrl(post?.coverImage || `/api/og?title=${post.title}`),
    },
  };
}

export default async function Post(params: Params) {
  const post = await getData(params);
  return (
    <article className="mb-32">
      <DocHero {...post} />
      <div className="max-w-2xl mx-auto">
        <div className="prose prose-outstatic">
          <MDXComponent content={post.content} />
        </div>
      </div>
    </article>
  );
}

async function getData({ params }: Params) {
  const db = await load();

  const post = await db
    .find<Post>({ collection: "posts", slug: params.slug }, [
      "title",
      "publishedAt",
      "description",
      "slug",
      "author",
      "content",
      "coverImage",
      "tags",
    ])
    .first();

  if (!post) {
    notFound();
  }

  const content = await MDXServer(post.content);

  return {
    ...post,
    content,
  };
}

export async function generateStaticParams() {
  const posts = getDocumentSlugs("posts");
  return posts.map((slug) => ({ slug }));
}

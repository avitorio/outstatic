import { GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";

type PostProps = {
  id: string;
  date: string;
  title: string;
  content: string;
  publishedAt: string;
};

export default function Post({ title, content, publishedAt }: PostProps) {
  const date = new Date(publishedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <nav className="p-8 text-white sticky top-0 z-50 ">
        <Link href="/">
          <a className="hover:text-blue-600">← Home</a>
        </Link>
      </nav>
      <main className="text-white max-w-5xl mx-auto">
        <h1 className="text-4xl mb-4 font-semibold">{title}</h1>
        <p className="mb-10">Written on {date}</p>
        <div
          className="prose prose-invert"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </main>
    </>
  );
}

import { getPaths, getContent } from "outstatic/server";

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const post = await getContent("posts", params?.slug as string);
  return {
    props: {
      ...post,
    },
  };
};

export const getStaticPaths = async () => {
  return {
    paths: getPaths("posts"),
    fallback: false,
  };
};

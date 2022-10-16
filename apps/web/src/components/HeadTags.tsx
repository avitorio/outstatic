const HeadTags = () => {
  return (
    <>
      <link
        rel="apple-touch-icon"
        sizes="180x180"
        href="/favicon/apple-touch-icon.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="32x32"
        href="/favicon/favicon-32x32.png"
      />
      <link
        rel="icon"
        type="image/png"
        sizes="16x16"
        href="/favicon/favicon-16x16.png"
      />
      <link rel="manifest" href="/favicon/site.webmanifest" />
      <link
        rel="mask-icon"
        href="/favicon/safari-pinned-tab.svg"
        color="#1B1F23"
      />
      <meta name="msapplication-TileColor" content="#1B1F23" />
      <meta name="theme-color" content="#ffffff" />
      <meta
        property="og:image"
        content="https://outstatic.com/images/og-image.png"
      />
      <meta
        property="og:image:alt"
        content="Outstatic - a static CMS for Next.js"
      />
    </>
  )
}

export default HeadTags

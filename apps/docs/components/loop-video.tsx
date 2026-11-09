import { docsBaseRoute } from '@/lib/shared'

// Media files live in public/docs/images. The docs app basePath is /docs, so
// the browser URL is /docs/docs/images rather than /docs/images.
function publicMediaSrc(src: string) {
  if (/^https?:\/\//.test(src)) return src
  if (
    src.startsWith(`${docsBaseRoute}/`) &&
    !src.startsWith(`${docsBaseRoute}${docsBaseRoute}/`)
  ) {
    return `${docsBaseRoute}${src}`
  }
  return src
}

export function LoopVideo({
  src,
  width,
  height,
  label
}: {
  src: string
  width: number
  height: number
  label: string
}) {
  return (
    <video
      autoPlay
      loop
      muted
      playsInline
      width={width}
      height={height}
      aria-label={label}
      className="my-6 w-full max-w-full rounded-lg border"
    >
      <source src={publicMediaSrc(src)} type="video/mp4" />
    </video>
  )
}

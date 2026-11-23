'use client'

import { useEffect, useRef } from 'react'
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
  const videoRef = useRef<HTMLVideoElement>(null)

  // Autoplay from here rather than the autoPlay attribute, so visitors who
  // prefer reduced motion get a paused video they can start themselves.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    video.muted = true
    video.play().catch(() => {})
  }, [])

  return (
    <video
      ref={videoRef}
      controls
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

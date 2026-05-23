type YoutubeProps = {
  url: string
}

function getVideoId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.slice(1) || null
    }
    if (parsed.hostname.endsWith('youtube.com')) {
      if (parsed.pathname === '/watch') {
        return parsed.searchParams.get('v')
      }
      const embedMatch = parsed.pathname.match(/^\/(embed|shorts)\/([^/]+)/)
      if (embedMatch) {
        return embedMatch[2]
      }
    }
    return null
  } catch {
    return null
  }
}

export default function Youtube({ url }: YoutubeProps) {
  const videoId = getVideoId(url)

  if (!videoId) {
    return (
      <div className="not-prose my-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900">
        Invalid YouTube URL: {url}
      </div>
    )
  }

  return (
    <div className="not-prose my-6 aspect-video w-full overflow-hidden rounded-lg border border-neutral-200">
      <iframe
        src={`https://www.youtube.com/embed/${videoId}`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  )
}

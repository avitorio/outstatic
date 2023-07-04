'use client'
import YouTube, { YouTubeProps } from 'react-youtube'

const HomeVideo = () => {
  const onPlayerReady: YouTubeProps['onReady'] = (event) => {
    event.target.pauseVideo()
  }

  const opts: YouTubeProps['opts'] = {
    // height: '525',
    // width: '700',
    playerVars: {
      // https://developers.google.com/youtube/player_parameters
      color: 'white',
      controls: 0,
      modestbranding: 1,
      rel: 0
    }
  }

  return (
    <div className="relative z-10 border border-t-[3px] border-b-[5px] border-x-4 border-black rounded-cartoon2 md:rounded-cartoon overflow-hidden max-w-[700px] bg-white">
      <YouTube
        videoId="K-YXF-dBKPI"
        opts={opts}
        onReady={onPlayerReady}
        className="relative pb-[56.25%] max-w-xs w-80 h-60 md:w-[700px] md:h-[525px] md:max-w-3xl"
        iframeClassName="absolute top-0 left-0 w-full h-full"
      />
    </div>
  )
}

export default HomeVideo

import { cn } from '../lib/utils'
import { ReactNode } from 'react'

export default function LoadingBackground({
  children,
  isLoading = true
}: {
  children?: ReactNode
  isLoading?: boolean
}) {
  return (
    <div id="outstatic">
      <div className="absolute left-0 z-0 h-screen w-full overflow-hidden bg-white md:-top-10 animate-in fade-in duration-300">
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 1200 365"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M-276.32 159.182C-232.477 130.613 -193.037 95.4797 -149.142 66.8773C-123.398 50.1026 -99.0091 30.5473 -69.5694 19.7442C-38.5686 8.36831 -2.85928 -3.31376 37.4064 4.54405C65.5725 10.0406 93.927 20.2194 125.473 43.3305C150.292 61.5127 166.609 84.5943 185.936 114.255C220.569 167.405 225.81 223.228 224.615 265.934C223.2 316.536 198.5 341.652 158.621 340.382C121.027 339.185 71.9868 320.328 45.0005 250.638C8.63388 156.723 111.095 159.937 149.344 159.325C235.509 157.945 334.997 185.056 433.145 218.102C547.034 256.448 651.041 336.753 780 356C940 384.5 1235.5 330.311 1237.95 70.5232"
            stroke="#1E293B"
            className={cn('stroke-2 md:stroke-1', isLoading && 'animate-draw')}
            strokeLinecap="round"
            strokeDasharray="4000"
          />
        </svg>
      </div>
      {children}
    </div>
  )
}

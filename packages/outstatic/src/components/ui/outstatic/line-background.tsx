import { cn } from '@/utils/ui'
import { ReactNode } from 'react'

export default function LineBackground({ children }: { children?: ReactNode }) {
  return (
    <div className="max-w-2xl">
      <div className="absolute bottom-0 left-0 md:left-[17rem] right-0 md:top-36 pointer-events-none">
        <svg
          fill="none"
          className="h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="m1555.43 194.147c-100.14 46.518-204.72 78.763-313.64 96.841-78.16 12.972-282.29 0-291.79-143.988-1.58-23.948 1-89.4705 67-127 58-32.9805 115.15-13.36095 142.5 5.5 27.35 18.861 45.02 44.5 54 73 16.37 51.951-9.22 115.124-30.65 161.874-57.09 124.562-177.31 219.357-311.976 246.789-142.617 29.052-292.036-9.369-430.683-41.444-100.166-23.173-196.003-36.724-298.229-15.203-48.046 10.115-94.9295 24.91-139.962 44.112"
            className={cn(
              'stroke-slate-900 stroke-2 md:stroke-1 animate-draw-once'
            )}
            strokeLinecap="round"
            strokeDasharray="4000"
          />
        </svg>
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  )
}

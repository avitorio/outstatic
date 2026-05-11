'use client'

import { useState } from 'react'

type CounterProps = {
  initialValue?: number
  step?: number
}

export default function Counter({ initialValue = 0, step = 1 }: CounterProps) {
  const [count, setCount] = useState(initialValue)

  return (
    <div className="not-prose my-6 flex items-center gap-3 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
      <button
        type="button"
        onClick={() => setCount((c) => c - step)}
        className="h-8 w-8 rounded-md border border-neutral-300 bg-white text-lg font-semibold hover:bg-neutral-100"
        aria-label="Decrement"
      >
        −
      </button>
      <span className="min-w-[3rem] text-center text-lg font-semibold tabular-nums">
        {count}
      </span>
      <button
        type="button"
        onClick={() => setCount((c) => c + step)}
        className="h-8 w-8 rounded-md border border-neutral-300 bg-white text-lg font-semibold hover:bg-neutral-100"
        aria-label="Increment"
      >
        +
      </button>
      <span className="ml-2 text-sm text-neutral-500">step: {step}</span>
    </div>
  )
}

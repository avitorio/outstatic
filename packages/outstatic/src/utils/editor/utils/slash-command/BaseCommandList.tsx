import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState
} from 'react'
import {
  CommandItemProps,
  updateScrollView
} from '../../extensions/SlashCommand'

export const BaseCommandList = ({
  items,
  command,
  setImageMenu
}: {
  items: CommandItemProps[]
  setImageMenu: (value: boolean) => void
  command: any
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const selectItem = useCallback(
    (index: number) => {
      const item = items[index]
      if (item.title === 'Image') {
        setImageMenu(true)
      } else if (item) {
        command(item)
      }
    },
    [items]
  )

  useEffect(() => {
    const navigationKeys = ['ArrowUp', 'ArrowDown', 'Enter']
    const onKeyDown = (e: KeyboardEvent) => {
      if (navigationKeys.includes(e.key)) {
        e.preventDefault()
        if (e.key === 'ArrowUp') {
          setSelectedIndex((selectedIndex + items.length - 1) % items.length)
          return true
        }
        if (e.key === 'ArrowDown') {
          setSelectedIndex((selectedIndex + 1) % items.length)
          return true
        }
        if (e.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [items, selectItem, selectedIndex])

  useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  const commandListContainer = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const container = commandListContainer?.current

    const item = container?.children[selectedIndex] as HTMLElement

    if (item && container) updateScrollView(container, item)
  }, [selectedIndex])

  return items.length > 0 ? (
    <div id="outstatic">
      <div
        id="slash-command"
        ref={commandListContainer}
        className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-md border border-stone-200 bg-white px-1 py-2 shadow-md transition-all"
      >
        {items.map((item: CommandItemProps, index: number) => {
          return (
            <button
              className={`flex w-full items-center space-x-2 rounded-md px-2 py-1 text-left text-sm text-stone-900 hover:bg-stone-100 ${
                index === selectedIndex ? 'bg-stone-100 text-stone-900' : ''
              }`}
              key={index}
              onClick={() => selectItem(index)}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md border border-stone-200 bg-white">
                {item.icon}
              </div>
              <div>
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-stone-500">{item.description}</p>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  ) : null
}

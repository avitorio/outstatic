import { useState } from 'react'

type AccordionProps = {
  title: string
  callback?: () => void
  children: React.ReactNode
}

const Accordion = ({ title, callback, children }: AccordionProps) => {
  const [show, setShow] = useState(false)

  const handleShow = () => {
    setShow(!show)
    if (callback) {
      callback()
    }
  }

  return (
    <div className="w-full border-b first:border-t">
      <h2 id="accordion-collapse-heading-1">
        <button
          type="button"
          className="flex items-center justify-between w-full text-sm font-medium text-gray-900 p-4 hover:bg-gray-50 focus:outline-none focus:outline-blue-300 focus:outline-offset-[-1px]"
          onClick={handleShow}
        >
          <span className="capitalize">{title}</span>
          <svg
            data-accordion-icon
            className={`w-6 h-6 shrink-0 ${show ? '' : 'rotate-180'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            ></path>
          </svg>
        </button>
      </h2>
      <div className={show ? 'block' : 'hidden'}>
        <div className="p-4 font-light border-gray-200 border-t">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Accordion

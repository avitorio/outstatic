type ModalProps = {
  close: () => void
  title: string
  children: React.ReactNode
}

const Modal = ({ children, title, close }: ModalProps) => (
  <div className="fixed inset-x-0 z-50 flex w-full  items-center justify-center overflow-y-auto overflow-x-hidden bg-[rgba(0,0,0,0.5)] md:inset-0 md:h-full">
    <div className="relative h-full w-full max-w-2xl p-4 md:h-auto">
      <div className="relative rounded-lg bg-white shadow">
        <div className="flex items-start justify-between rounded-t border-b p-4">
          <h3 className="text-xl font-semibold text-gray-900 capitalize">
            {title}
          </h3>
          <button
            type="button"
            className="ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900 dark:hover:bg-gray-600 dark:hover:text-white"
            data-modal-toggle="defaultModal"
            onClick={close}
          >
            <svg
              className="h-5 w-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              ></path>
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  </div>
)

export default Modal

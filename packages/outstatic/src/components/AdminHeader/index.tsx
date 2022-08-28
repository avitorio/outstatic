import Link from 'next/link'
import { useState } from 'react'
import { ostSignOut } from '../../utils/auth/hooks'

type AdminHeaderProps = {
  name?: string | null | undefined
  email?: string | null | undefined
  image?: string | null | undefined
  status?: 'authenticated' | 'unauthenticated' | 'loading'
  toggleSidebar: () => void
}

const AdminHeader = ({
  name,
  email,
  image,
  status,
  toggleSidebar
}: AdminHeaderProps) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <nav className="relative border-b border-gray-200 bg-white px-2 py-2.5 dark:border-gray-600 dark:bg-gray-800 sm:px-4">
        <div className="mx-auto flex flex-wrap items-center justify-between">
          <button
            data-collapse-toggle="mobile-menu-2"
            type="button"
            className="ml-1 inline-flex items-center rounded-lg p-2 text-sm text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600 md:hidden"
            aria-controls="mobile-menu-2"
            aria-expanded="false"
            onClick={toggleSidebar}
          >
            <span className="sr-only">Open main menu</span>
            <svg
              className="h-6 w-6"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            <svg
              className="hidden h-6 w-6"
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
          <Link href="/outstatic">
            <a className="flex items-center">
              <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white">
                Outstatic
              </span>
            </a>
          </Link>
          {status === 'loading' || (
            <div className="flex items-center md:order-2">
              <button
                type="button"
                className="mr-3 flex items-center rounded-full bg-gray-800 text-sm focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600 md:mr-0"
                id="user-menu-button"
                aria-expanded="false"
                data-dropdown-toggle="dropdown"
                onClick={() => setIsOpen(!isOpen)}
              >
                <span className="sr-only">Open user menu</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="h-8 w-8 rounded-full"
                  src={image || ''}
                  alt="user"
                />
              </button>
              <div
                className={`right-0 top-[60px] z-50 my-4 w-full list-none divide-y divide-gray-100 rounded bg-white text-base shadow dark:divide-gray-600 dark:bg-gray-700 md:-right-0 md:top-[52px] md:w-auto ${
                  isOpen ? 'block' : 'hidden'
                }`}
                id="dropdown"
                style={{
                  position: 'absolute',
                  margin: '0px'
                }}
              >
                <div className="py-3 px-4 dark:bg-gray-700">
                  <span className="block text-sm text-gray-900 dark:text-white">
                    {name}
                  </span>
                  <span className="block truncate text-sm font-medium text-gray-500 dark:text-gray-400">
                    {email}
                  </span>
                </div>
                <ul
                  className="py-1 dark:bg-gray-700"
                  aria-labelledby="dropdown"
                >
                  <li>
                    <a
                      className="block cursor-pointer py-2 px-4 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-600 dark:hover:text-white"
                      onClick={() => ostSignOut()}
                    >
                      Sign out
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  )
}

export default AdminHeader

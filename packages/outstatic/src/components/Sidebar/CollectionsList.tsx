import { useCollections } from '@/utils/hooks/useCollections'
import Link from 'next/link'

const CollectionsList = () => {
  const { data: collections } = useCollections()

  return (
    <>
      <li>
        <Link href="/outstatic">
          <div className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100">
            <svg
              className="h-6 w-6 shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="24"
              height="24"
            >
              <path fill="none" d="M0 0h24v24H0z" />
              <path
                fill="currentColor"
                d="M13 21V11h8v10h-8zM3 13V3h8v10H3zm6-2V5H5v6h4zM3 21v-6h8v6H3zm2-2h4v-2H5v2zm10 0h4v-6h-4v6zM13 3h8v6h-8V3zm2 2v2h4V5h-4z"
              />
            </svg>
            <span className="ml-3">Collections</span>
          </div>
        </Link>
      </li>
      {collections
        ? collections.map((collection) => (
            <li key={collection}>
              <Link href={`/outstatic/${collection}`}>
                <div className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100">
                  <svg
                    className="h-6 w-6 shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    ></path>
                  </svg>
                  <span className="ml-3 capitalize">{collection}</span>
                </div>
              </Link>
            </li>
          ))
        : null}
      <li>
        <Link href="/outstatic/settings">
          <div className="flex cursor-pointer items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100">
            <svg
              className="h-6 w-6 shrink-0 text-gray-500 transition duration-75 group-hover:text-gray-900"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span className="ml-3 flex-1 whitespace-nowrap">Settings</span>
          </div>
        </Link>
      </li>
    </>
  )
}

export default CollectionsList

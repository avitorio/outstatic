import Link from '@/components/Link'
import { OUTSTATIC_VERSION } from '@/utils/constants'
import generateUniqueId from '@/utils/generateUniqueId'
import useOutstatic from '@/utils/hooks/useOutstatic'
import cookies from 'js-cookie'
import { useEffect, useState } from 'react'

type SidebarProps = {
  isOpen: boolean
}

type Broadcast = {
  title: string
  content: string
  link: string
}

const initialBroadcast = () => {
  const broadcast = cookies.get('ost_broadcast')

  return broadcast ? JSON.parse(broadcast) : null
}

const Sidebar = ({ isOpen = false }: SidebarProps) => {
  const [broadcast, setBroadcast] = useState<Broadcast | null>(
    initialBroadcast()
  )
  const { collections, repoOwner, repoSlug } = useOutstatic()

  useEffect(() => {
    const fetchBroadcast = async () => {
      const url = new URL(`https://analytics.outstatic.com/`)
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const uniqueId = await generateUniqueId({ repoOwner, repoSlug })
      url.searchParams.append('timezone', timezone)
      url.searchParams.append('unique_id', uniqueId)
      url.searchParams.append('version', OUTSTATIC_VERSION)
      await fetch(url.toString())
        .then((res) => res.json())
        .then((data) => {
          if (data?.title) {
            setBroadcast(data)
            cookies.set('ost_broadcast', JSON.stringify(data), {
              expires: 1 // 1 day
            })
          }
        })
        .catch((err) => {
          console.log(err)
        })
    }

    if (!broadcast) {
      fetchBroadcast()
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <aside
      className={`absolute top-[53px] z-20 h-full w-full md:relative md:top-0 lg:block md:w-64 md:min-w-[16rem] ${
        isOpen ? 'block' : 'hidden'
      }`}
      aria-label="Sidebar"
    >
      <div className="flex flex-col py-4 px-3 h-full max-h-[calc(100vh-96px)] overflow-y-scroll scrollbar-hide bg-gray-50 justify-between">
        <ul className="space-y-2">
          <li>
            <Link href="/outstatic">
              <div className="flex items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 cursor-pointer">
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
          <>
            {collections.map((collection) => (
              <li key={collection}>
                <Link href={`/outstatic/${collection}`}>
                  <div className="flex items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 cursor-pointer">
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
            ))}
          </>
          <li>
            <Link href="/outstatic/settings">
              <div className="flex items-center rounded-lg p-2 text-base font-normal text-gray-900 hover:bg-gray-100 cursor-pointer">
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
        </ul>
        {broadcast ? (
          <div
            className="p-4 mt-6 rounded-lg bg-white border border-gray"
            role="alert"
          >
            <div className="flex items-center mb-3">
              <span className="bg-blue-100 text-blue-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                {broadcast.title}
              </span>
            </div>
            <p className="text-sm">{broadcast.content}</p>
            {broadcast?.link ? (
              <a href={broadcast.link} target="_blank" rel="noreferrer">
                <span className="mt-3 text-xs underline font-medium">
                  Learn more
                </span>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="h-10 bg-gray-50 py-2 px-4 border-t text-xs flex justify-between items-center w-full">
        <a
          className="font-semibold text-gray-500 hover:underline hover:text-gray-900"
          href="https://outstatic.com/docs"
          target="_blank"
          rel="noreferrer"
        >
          Documentation
        </a>
        <div className="gap-2 flex items-center justify-center">
          <a
            href="https://github.com/avitorio/outstatic"
            target="_blank"
            aria-label="GitHub"
            rel="noreferrer"
            className="group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              fill="none"
              aria-label="GitHub logo"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
                transform="scale(1.2)"
                className="fill-gray-400 group-hover:fill-gray-900"
              />
            </svg>
          </a>
          <a
            href="https://x.com/outstatic"
            target="_blank"
            aria-label="X.com"
            rel="noreferrer"
            className="group w-5 h-5 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 300 300.251"
              width="17"
              height="17"
              fill="none"
            >
              <path
                className="fill-gray-400 group-hover:fill-gray-900"
                d="M178.57 127.15 290.27 0h-26.46l-97.03 110.38L89.34 0H0l117.13 166.93L0 300.25h26.46l102.4-116.59 81.8 116.59h89.34M36.01 19.54H76.66l187.13 262.13h-40.66"
              />
            </svg>
          </a>
          <a
            href="https://discord.gg/cR33yCRY"
            target="_blank"
            aria-label="Discord"
            rel="noreferrer"
            className="group w-5 h-5 flex items-center justify-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              width="18"
              height="18"
              viewBox="0 -28.5 256 256"
              version="1.1"
              preserveAspectRatio="xMidYMid"
            >
              <g>
                <path
                  className="fill-gray-400 group-hover:fill-gray-900"
                  d="M216.856339,16.5966031 C200.285002,8.84328665 182.566144,3.2084988 164.041564,0 C161.766523,4.11318106 159.108624,9.64549908 157.276099,14.0464379 C137.583995,11.0849896 118.072967,11.0849896 98.7430163,14.0464379 C96.9108417,9.64549908 94.1925838,4.11318106 91.8971895,0 C73.3526068,3.2084988 55.6133949,8.86399117 39.0420583,16.6376612 C5.61752293,67.146514 -3.4433191,116.400813 1.08711069,164.955721 C23.2560196,181.510915 44.7403634,191.567697 65.8621325,198.148576 C71.0772151,190.971126 75.7283628,183.341335 79.7352139,175.300261 C72.104019,172.400575 64.7949724,168.822202 57.8887866,164.667963 C59.7209612,163.310589 61.5131304,161.891452 63.2445898,160.431257 C105.36741,180.133187 151.134928,180.133187 192.754523,160.431257 C194.506336,161.891452 196.298154,163.310589 198.110326,164.667963 C191.183787,168.842556 183.854737,172.420929 176.223542,175.320965 C180.230393,183.341335 184.861538,190.991831 190.096624,198.16893 C211.238746,191.588051 232.743023,181.531619 254.911949,164.955721 C260.227747,108.668201 245.831087,59.8662432 216.856339,16.5966031 Z M85.4738752,135.09489 C72.8290281,135.09489 62.4592217,123.290155 62.4592217,108.914901 C62.4592217,94.5396472 72.607595,82.7145587 85.4738752,82.7145587 C98.3405064,82.7145587 108.709962,94.5189427 108.488529,108.914901 C108.508531,123.290155 98.3405064,135.09489 85.4738752,135.09489 Z M170.525237,135.09489 C157.88039,135.09489 147.510584,123.290155 147.510584,108.914901 C147.510584,94.5396472 157.658606,82.7145587 170.525237,82.7145587 C183.391518,82.7145587 193.761324,94.5189427 193.539891,108.914901 C193.539891,123.290155 183.391518,135.09489 170.525237,135.09489 Z"
                  fill-rule="nonzero"
                ></path>
              </g>
            </svg>
          </a>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar

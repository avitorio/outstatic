import Link from 'next/link'

const Header = () => {
  return (
    <nav className="bg-white flex items-center justify-between py-4 px-10 border-b sticky top-0 z-10 h-16">
      <Link href="/">
        <a className="font-semibold text-xl">Outstatic</a>
      </Link>
      <ul className="flex items-center justify-between space-x-3 text-xs md:space-x-4 md:text-base">
        <li>
          <Link href="/">
            <a className="hover:underline">Home</a>
          </Link>
        </li>
        <li>
          <Link href="/#posts">
            <a className="hover:underline">Posts</a>
          </Link>
        </li>
        <li>
          <Link href="/docs/getting-started">
            <a className="hover:underline">Docs</a>
          </Link>
        </li>
      </ul>
    </nav>
  )
}

export default Header

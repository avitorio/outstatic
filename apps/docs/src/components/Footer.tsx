const Footer = () => {
  return (
    <footer className="bg-neutral-50 border-t border-neutral-200">
      <div className="max-w-6xl mx-auto px-5 p-10">
        <h3 className="font-semibold text-2xl mb-10 lg:mb-0 lg:pr-4">
          Sample website built with{' '}
          <a className="underline" href="https://outstatic.com/">
            Outstatic
          </a>{' '}
          and{' '}
          <a className="underline" href="https://nextjs.org/">
            Next.js
          </a>
        </h3>
      </div>
    </footer>
  )
}

export default Footer

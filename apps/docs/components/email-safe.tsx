import type { ReactNode } from 'react'

// Cloudflare email obfuscation rewrites git@github.com inside code into a
// /cdn-cgi/l/email-protection link. These comments keep the address as text.
export function EmailSafe({ children }: { children: ReactNode }) {
  return (
    <>
      <span dangerouslySetInnerHTML={{ __html: '<!--email_off-->' }} />
      {children}
      <span dangerouslySetInnerHTML={{ __html: '<!--email_on-->' }} />
    </>
  )
}

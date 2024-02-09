import { ComponentPropsWithRef } from 'react'

export function Pre(props: ComponentPropsWithRef<'pre'>) {
  return (
    <pre {...props}>
      {props.children}
      <style jsx>{`
        pre {
          position: relative;
          padding-top: 2.5rem;
        }
      `}</style>
    </pre>
  )
}

export function CustomCode(props: ComponentPropsWithRef<'code'>) {
  const language = props.className?.includes('language')
    ? props.className.replace('language-', '').replace(' code-highlight', '')
    : null

  return (
    <code {...props} data-code-type={language && 'code-block'}>
      {language ? (
        <div className="overflow-x-auto">{props.children}</div>
      ) : (
        <span>{props.children}</span>
      )}

      {language && (
        <div className="absolute top-0 right-6 rounded-b-md border border-t-0 border-gray-600 px-3 py-1">
          <span className="select-none bg-gradient-to-tr from-primary-300 to-primary-400 bg-clip-text font-medium text-white">
            {language}
          </span>
        </div>
      )}
    </code>
  )
}

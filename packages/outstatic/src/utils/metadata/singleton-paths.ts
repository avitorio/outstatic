export function isInSingletonDirectory(
  path: string,
  singletonDirectories: string[]
): boolean {
  return singletonDirectories.some((directory) =>
    directory === ''
      ? !path.includes('/')
      : path === directory || path.startsWith(`${directory}/`)
  )
}

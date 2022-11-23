export function assertUnreachable(_x: never): never {
  throw new Error(
    `Reached a code that should be unreachable. This can happen, when a TS type is incorrectly defined.`
  )
}

module.exports = {
  '*.(md|json|graphql)': 'prettier --write',
  ...[
    'apps/dev',
    'apps/web',
    'examples/blog',
    'packages/eslint-custom-config',
    'packages/outstatic',
    'packages/tailwind-config',
    'packages/tsconfig'
  ].reduce((actions, pkg) => {
    actions[`${pkg}/**/*.{cjs,mjs,js,jsx,ts,tsx}`] = [
      'eslint --fix',
      // uncomment to enable type-checking a project in lint-staged
      // () => `tsc --project ./${pkg}/tsconfig.json --noEmit`,
      'prettier --write'
    ]
    return actions
  }, {})
}

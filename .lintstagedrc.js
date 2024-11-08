module.exports = {
  '(!README)*.(md|json|graphql)': 'prettier --write',
  ...[
    'apps/dev',
    'apps/docs',
    'examples/advanced-blog',
    'examples/basic-blog',
    'examples/docs',
    'examples/outstatic-dashboard',
    'packages/outstatic'
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

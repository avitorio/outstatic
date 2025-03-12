module.exports = {
  root: true,
  extends: ['next', 'turbo', 'prettier'],
  settings: {
    next: {
      rootDir: ['apps/*/']
    }
  },
  env: {
    browser: true,
    es2020: true,
    jest: true,
    node: true
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/jsx-key': 'off'
  }
}

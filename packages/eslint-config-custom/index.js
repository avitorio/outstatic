module.exports = {
  env: {
    browser: true,
    es2020: true,
    jest: true,
    node: true
  },
  extends: ['next', 'turbo', 'prettier'],
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/jsx-key': 'off'
  }
}

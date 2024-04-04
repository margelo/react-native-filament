module.exports = {
  root: true,
  extends: ['@react-native', 'prettier'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        quoteProps: 'consistent',
        singleQuote: true,
        tabWidth: 2,
        trailingComma: 'es5',
        useTabs: false,
      },
    ],

    // react hooks
    'react-hooks/exhaustive-deps': [
      'error',
      {
        additionalHooks: '(useWorkletEffect|useWorklet)',
      },
    ],
  },
}

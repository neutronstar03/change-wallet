import antfu from '@antfu/eslint-config';

export default antfu(
  {
    react: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: true,
    },
    ignores: [
      'dist/**',
    ],
  },
  {
    rules: {
      'antfu/top-level-function': 'off',
      'no-console': 'off',
      'antfu/no-top-level-await': 'off',
      'dot-notation': 'off',
      eqeqeq: 'off',
      'jsonc/sort-keys': 'off',
      'node/prefer-global/process': 'off',
      'perfectionist/sort-imports': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'react/prefer-namespace-import': 'off',
      'style/quote-props': ['error', 'as-needed'],
      'ts/consistent-type-definitions': 'off',
      'ts/no-use-before-define': 'off',
    },
  },
);

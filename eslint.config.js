import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'playwright-report', 'test-results', 'src/routeTree.gen.ts'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      // Regra de arquitetura: uma feature não importa de outra.
      // O que duas features precisam sobe para lib/ ou components/.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*/*/**'],
              message:
                'Importe pelo index público da feature (@/features/x), nunca por caminho interno.',
            },
          ],
        },
      ],
    },
  },
  {
    // Os componentes do shadcn/ui exportam componente e a cva de variantes no
    // mesmo arquivo, como o registro entrega. Vale manter: quem for atualizar
    // compara com o upstream sem ruído. Só aqui, não no resto do app.
    files: ['src/components/ui/**/*.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
  {
    // scripts de build rodam em Node e ficam fora do projeto TypeScript
    files: ['**/*.js', '**/*.mjs', 'eslint.config.js'],
    ...tseslint.configs.disableTypeChecked,
    // depois do spread, senão ele sobrescreve os globals
    languageOptions: { globals: globals.node },
  },
)

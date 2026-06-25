// eslint.config.js
const no_drizzle_outside_repos = {
  meta: { type: 'problem' },
  create(context) {
    return {
      ImportDeclaration(node) {
        const src = node.source.value;
        const isDrizzle = [
          'drizzle-orm', 'better-sqlite3',
          '@/backend/config/schema', '@/backend/config/db',
        ].some((p) => src === p || (typeof src === 'string' && src.startsWith(p + '/')));
        if (!isDrizzle) return;
        const filename = context.getFilename();
        if (!filename.endsWith('.repository.ts') && !filename.includes('/repositories/')) {
          context.report(node, 'Drizzle imports are only allowed inside repositories/');
        }
      },
    };
  },
};

export default [
  {
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.name='fetch'][arguments.0.type='Literal'][arguments.0.value=/^\\//]",
        message: 'Use invokeService() or a module contract instead of fetch().',
      }],
    },
    plugins: {
      local: { rules: { 'no-drizzle-outside-repos': no_drizzle_outside_repos } },
    },
  },
  {
    files: ['src/frontend/**/*.ts', 'src/frontend/**/*.tsx'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['@/backend/modules/*/services/*'],     message: 'Import from contracts/ not services/' },
          { group: ['@/backend/modules/*/repositories/*'], message: 'Import from contracts/ not repositories/' },
          { group: ['@/backend/config/db'],                message: 'DB config is backend-only' },
          { group: ['@/backend/config/schema'],            message: 'Schema is backend-only' },
          { group: ['drizzle-orm', 'better-sqlite3'],      message: 'ORM imports are backend-only' },
        ],
      }],
    },
  },
  {
    files: ['src/bootstrap/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['react', 'react/*', 'next/*'], message: 'Bootstrap is framework-free' },
        ],
      }],
    },
  },
];
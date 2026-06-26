import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const noDrizzleOutsideRepos = {
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

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'shared',       pattern: 'src/frontend/shared/**' },
        { type: 'core',         pattern: 'src/frontend/core/**' },
        { type: 'bootstrap',    pattern: 'src/frontend/bootstrap/**' },
        { type: 'modules',      pattern: 'src/frontend/modules/**' },
        { type: 'store',        pattern: 'src/frontend/store/**' },
        { type: 'routes',       pattern: 'src/frontend/routes/**' },
        { type: 'styles',       pattern: 'src/frontend/styles/**' },
        { type: 'app',          pattern: 'src/app/**' },
      ],
    },
    rules: {
      'boundaries/dependencies': ['error', {
        default: 'disallow',
        rules: [
          { from: { type: 'shared' },    allow: [{ to: { type: ['store'] } }] },
          { from: { type: 'core' },      allow: [{ to: { type: ['shared', 'store'] } }] },
          { from: { type: 'modules' },   allow: [{ to: { type: ['shared', 'core', 'store'] } }] },
          { from: { type: 'store' },     allow: [{ to: { type: ['shared', 'core'] } }] },
          { from: { type: 'routes' },    allow: [{ to: { type: ['modules', 'shared', 'core'] } }] },
          { from: { type: 'bootstrap' }, allow: [{ to: { type: ['core', 'shared'] } }] },
          { from: { type: 'app' },       allow: [{ to: { type: ['modules', 'shared', 'core', 'store', 'styles'] } }] },
        ],
      }],
    },
  },
  {
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "CallExpression[callee.name='fetch'][arguments.0.type='Literal'][arguments.0.value=/^\\//]",
        message: 'Use invokeService() or a module contract instead of fetch().',
      }],
    },
    plugins: {
      local: { rules: { 'no-drizzle-outside-repos': noDrizzleOutsideRepos } },
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
]);

export default eslintConfig;

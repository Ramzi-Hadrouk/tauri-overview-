// tools/eslint-rules/no-drizzle-outside-repos.js
module.exports = {
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
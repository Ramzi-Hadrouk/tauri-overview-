<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# TypeScript Type Generation

After modifying any Rust struct that has `#[derive(TS)]`, regenerate frontend types:

```bash
npm run gen:types
```

This runs `cargo test` in `src-tauri/` (ts-rs test-phase export) and copies the output to `src/frontend/shared/types/generated/`.

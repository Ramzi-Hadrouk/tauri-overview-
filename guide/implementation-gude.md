# Final Architecture Plan — Client Management Desktop Application

> **Stack**: Next.js (static export) + Tauri + Drizzle ORM + SQLite + MUI + TypeScript
> **Paradigm**: DDD-inspired modules, Repository Pattern, no internal HTTP, structured tracing, defined state boundaries, production-safe backups.

---

## PART 0 — Project Setup & Installation

### 0.1 Prerequisites

| Tool | Version | How to install |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| Rust (stable) | ≥ 1.77 | `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs \| sh` |
| Tauri CLI | 1.x | `cargo install tauri-cli` |
| Visual C++ Build Tools | any | Required on Windows for `better-sqlite3` native bindings |

Verify everything is ready:

```bash
node -v          # should print v20.x.x
rustc --version  # should print rustc 1.77 or newer
cargo tauri -V   # should print tauri-cli 1.x
```

### 0.2 Scaffold the Project

```bash
# 1. Create Next.js project (App Router + TypeScript + src/ directory)
npx create-next-app@latest client-manager-desktop \
  --typescript \
  --eslint \
  --tailwind=false \
  --app \
  --src-dir \
  --import-alias "@/*"

cd client-manager-desktop

# 2. Initialise Tauri inside the existing project
cargo tauri init
# When prompted:
#   App name:             Client Manager
#   Window title:         Client Manager
#   Web assets location:  ../out
#   Dev URL:              http://localhost:3000
#   Dev command:          npm run dev
#   Build command:        npm run build
```

### 0.3 Install All Dependencies

```bash
# ── Runtime ──────────────────────────────────────────────────────────
npm install \
  @mui/material @emotion/react @emotion/styled @mui/icons-material \
  zustand \
  drizzle-orm better-sqlite3 \
  zod \
  @tauri-apps/api

# ── Dev ──────────────────────────────────────────────────────────────
npm install --save-dev \
  drizzle-kit \
  tsx \
  vitest @vitest/coverage-v8 \
  playwright @playwright/test \
  @types/better-sqlite3 \
  eslint-plugin-import
```

### 0.4 Configure TypeScript Path Aliases

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

With this single `@/*` alias everything resolves through `src/`:

| Import | Resolves to |
|---|---|
| `@/backend/core/tracing` | `src/backend/core/tracing.ts` |
| `@/frontend/store/ui-store` | `src/frontend/store/ui-store.ts` |
| `@/bootstrap/app-init` | `src/bootstrap/app-init.ts` |

### 0.5 Create the Folder Skeleton

Run once from the project root:

```bash
# App router
mkdir -p src/app/"(dashboard)"/{clients,settings}

# Bootstrap
mkdir -p src/bootstrap

# Backend
mkdir -p src/backend/{core,config,di}
mkdir -p src/backend/shared/tauri
mkdir -p src/backend/modules/"(core-domain)"/clients/{domain,contracts,repositories,services,dto,tests/{unit,repository,integration}}
mkdir -p src/backend/modules/"(operations)"/backup/{domain,contracts,repositories,services,tests}

# Frontend
mkdir -p src/frontend/{core,store,styles}
mkdir -p src/frontend/shared/{layouts/dashboard-shell,ui,hooks,utils,lib,constants}
mkdir -p src/frontend/modules/"(dashboard)"/clients/layouts
mkdir -p src/frontend/modules/"(dashboard)"/clients/feature-client-list/{application,components,sections,hooks}
mkdir -p src/frontend/modules/"(dashboard)"/clients/feature-client-form/{application,components,hooks}
mkdir -p src/frontend/modules/"(dashboard)"/clients/feature-backup-restore/{application,components}

# Tests
mkdir -p tests/{unit,repository,integration,e2e}

# Tooling
mkdir -p tools/eslint-rules
mkdir -p drizzle/meta
```

### 0.6 First Run

```bash
# Terminal 1 — Next.js dev server (hot-reload)
npm run dev

# Terminal 2 — Tauri shell wrapping the webview
npm run tauri:dev
```

---

## PART 1 — Executive Summary of Revisions

| # | Revision | Replaces |
|---|----------|----------|
| 1 | Direct service calls + Tauri IPC | Next.js Route Handlers / REST endpoints |
| 2 | Drizzle ORM | Prisma |
| 3 | Repository Pattern enforced (Service → Repository → Drizzle) | Same, kept and tightened |
| 4 | `VACUUM INTO` backup strategy | Raw file copy of `.db`/`.db-wal`/`.db-shm` |
| 5 | DB-level filtering & pagination | In-memory TypeScript filtering |
| 6 | Startup migration workflow with version checks | "Run migrate on deploy" only |
| 7 | `tracing` (Rust) + structured frontend logger | `console.log` |
| 8 | Four-layer test pyramid | Ad-hoc tests |
| 9 | Three explicit state boundaries (UI / Feature / Server) | Single global Zustand store |
| 10 | `src/` split into `backend/`, `frontend/`, `bootstrap/`, `app/` | Flat `src/` with `server/` and `modules/` |
| 11 | Contracts folder **inside each backend module** | Central `src/api/contracts/` folder |

---

## PART 2 — Revised Project Structure

```
client-manager-desktop/
│
├── drizzle/                              # Drizzle migrations (generated — never edit by hand)
│   ├── 0000_init.sql
│   ├── 0001_add_client_archived.sql
│   └── meta/
│       └── journal.json
│
├── drizzle.config.ts                     # Points to src/backend/config/schema.ts
│
├── src-tauri/                            # Rust / Tauri layer
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs
│       ├── lib.rs
│       ├── commands/
│       │   ├── backup.rs                 # VACUUM INTO / restore commands
│       │   ├── database.rs               # get_db_path, get_db_size, write_log
│       │   └── fs.rs                     # Native FS helpers (future)
│       ├── tracing_setup.rs              # tracing-subscriber init (file + stdout)
│       └── error.rs                      # AppError → serialise to IPC JSON
│
├── src/
│   │
│   ├── app/                              # Next.js App Router — ROUTING ONLY, no business logic
│   │   ├── layout.tsx                   # Root layout: ThemeProvider + bootstrap + CssBaseline
│   │   ├── page.tsx                     # Root redirect → /clients
│   │   └── (dashboard)/
│   │       ├── clients/
│   │       │   └── page.tsx             # Composes DashboardShell + ClientsLayout + features
│   │       └── settings/
│   │           └── page.tsx             # Composes DashboardShell + SettingsLayout + features
│   │
│   ├── bootstrap/                        # Application startup — runs once before UI mounts
│   │   ├── app-init.ts                  # Orchestrates: initDatabase → runMigrations → versionGuard
│   │   ├── migration-runner.ts          # Wraps drizzle-kit migrator
│   │   └── version-guard.ts            # Reads/writes schema_meta; halts on incompatible version
│   │
│   ├── backend/                          # ALL server-side / DDD code — zero JSX, zero Next.js
│   │   │
│   │   ├── core/                        # Cross-module backend primitives
│   │   │   ├── exceptions.ts            # ApplicationError, NotFoundError, SchemaIncompatibleError
│   │   │   ├── result.ts                # Result<T, E> discriminated union
│   │   │   ├── pagination.ts            # PaginatedResult<T> interface
│   │   │   ├── tracing.ts               # Frontend-side structured logger (→ Tauri write_log in prod)
│   │   │   └── service-invoker.ts       # In-process service call bridge (replaces fetch)
│   │   │
│   │   ├── config/                      # Database + environment configuration
│   │   │   ├── db.ts                    # Drizzle singleton: initDatabase / getDb / closeDatabase
│   │   │   ├── schema.ts                # Drizzle table definitions (clients, schema_meta)
│   │   │   └── env.ts                   # APP_SCHEMA_VERSION, MIN_COMPATIBLE_SCHEMA_VERSION
│   │   │
│   │   ├── di/
│   │   │   └── container.ts             # Composition root — assembles and exports service singletons
│   │   │
│   │   ├── shared/                      # Backend-only shared utilities
│   │   │   └── tauri/
│   │   │       └── ipc-client.ts        # Typed invoke() wrapper — used by contracts only
│   │   │
│   │   └── modules/
│   │       │
│   │       ├── (core-domain)/clients/   # Core domain — main business entity
│   │       │   │
│   │       │   ├── domain/
│   │       │   │   ├── entities.ts      # Client, ClientCreateData, ClientUpdateData
│   │       │   │   ├── exceptions.ts    # ClientValidationError, ClientNotFoundError, ClientAlreadyExistsError
│   │       │   │   └── rules.ts         # validateEmail, validatePhone, sortClientsByName…
│   │       │   │
│   │       │   ├── contracts/           # ← PUBLIC SURFACE: the ONLY files frontend may import from this module
│   │       │   │   └── client.contract.ts   # clientContract: search / create / update / delete
│   │       │   │
│   │       │   ├── repositories/
│   │       │   │   ├── client.repository.ts          # Interface: getById, search, save, update, delete…
│   │       │   │   ├── drizzle-client.repository.ts  # Drizzle implementation
│   │       │   │   └── mappers.ts                    # DB row → Client entity
│   │       │   │
│   │       │   ├── services/
│   │       │   │   ├── create-client.service.ts
│   │       │   │   ├── update-client.service.ts
│   │       │   │   ├── delete-client.service.ts
│   │       │   │   └── search-clients.service.ts     # DB-level search, sort, paginate
│   │       │   │
│   │       │   ├── dto/
│   │       │   │   └── client-filters.dto.ts          # Zod schema + ClientFilters type
│   │       │   │
│   │       │   └── tests/
│   │       │       ├── unit/            # Domain rules, pure service logic
│   │       │       ├── repository/      # Repository against in-memory SQLite
│   │       │       └── integration/     # Service → Repository → real temp DB
│   │       │
│   │       └── (operations)/backup/     # Cross-cutting: backup/restore (uses Tauri IPC)
│   │           │
│   │           ├── domain/
│   │           │   └── entities.ts      # BackupResult, RestoreResult
│   │           │
│   │           ├── contracts/           # ← PUBLIC SURFACE for backup operations
│   │           │   └── backup.contract.ts   # backupContract: create / restore / verify / getDbPath
│   │           │
│   │           ├── repositories/
│   │           │   └── backup.repository.ts  # Wraps Tauri IPC (interface)
│   │           │
│   │           ├── services/
│   │           │   ├── create-backup.service.ts
│   │           │   └── restore-backup.service.ts
│   │           │
│   │           └── tests/
│   │
│   └── frontend/                         # ALL React / UI code — zero DB imports, zero drizzle
│       │
│       ├── core/                         # App-wide frontend infrastructure
│       │   └── theme.ts                  # MUI light + dark theme (createTheme tokens)
│       │
│       ├── store/                        # Global UI state ONLY — no server data
│       │   ├── ui-store.ts               # themeMode, drawer, toasts, confirm dialog
│       │   └── index.ts                  # Barrel export + boundary documentation comment
│       │
│       ├── shared/                       # Cross-feature frontend utilities
│       │   │
│       │   ├── layouts/                  # Shared layouts used by more than one module
│       │   │   └── dashboard-shell/
│       │   │       ├── DashboardShell.tsx   # AppBar + Drawer + main content slot
│       │   │       └── index.ts
│       │   │
│       │   ├── ui/                       # Reusable MUI wrapper components (Button, Table, Dialog…)
│       │   ├── hooks/                    # Reusable hooks: useDebounce, usePrevious…
│       │   ├── utils/                    # Pure TS helpers: formatDate, truncate…
│       │   ├── lib/                      # Third-party wrappers
│       │   └── constants/               # App-wide enums, labels, route paths
│       │
│       ├── styles/
│       │   └── globals.css              # Global CSS resets (minimal — MUI handles most)
│       │
│       └── modules/
│           └── (dashboard)/clients/     # Clients module — all client-related UI
│               │
│               ├── layouts/             # Module-specific layout (client-section chrome)
│               │   └── ClientsLayout.tsx
│               │
│               ├── feature-client-list/
│               │   ├── application/
│               │   │   ├── client-list-store.ts   # Feature state: filters, selectedId, cachedItems
│               │   │   └── use-load-clients.ts    # Calls clientContract.search → populates store
│               │   ├── components/
│               │   ├── sections/
│               │   │   └── ClientListSection.tsx  # Top-level section rendered by page
│               │   └── hooks/
│               │
│               ├── feature-client-form/
│               │   ├── application/
│               │   │   ├── client-form-store.ts   # Draft state, validation errors
│               │   │   └── use-client-form.ts     # create/update via clientContract
│               │   ├── components/
│               │   └── hooks/
│               │
│               └── feature-backup-restore/
│                   ├── application/
│                   │   └── use-backup.ts          # create/restore via backupContract
│                   └── components/
│
├── tests/                                # Global test suite (parallel to src/)
│   ├── unit/
│   ├── repository/
│   ├── integration/
│   ├── e2e/
│   └── setup.ts                         # Vitest global setup
│
├── tools/
│   └── eslint-rules/
│       └── no-drizzle-outside-repos.js  # Custom ESLint rule
│
├── drizzle.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── next.config.ts                        # output: 'export'
├── eslint.config.js
└── package.json
```

### 2.1 Folder Responsibility at a Glance

| Folder | Owns | Must NOT contain |
|---|---|---|
| `src/app/` | Next.js routes + root layout | Business logic, DB calls |
| `src/bootstrap/` | App startup sequence | JSX, React |
| `src/backend/core/` | ApplicationError, Result, PaginatedResult, logger, service-invoker | Domain rules, JSX |
| `src/backend/config/` | Drizzle schema, DB singleton, env constants | Services, React |
| `src/backend/di/` | Composition root (container) | UI |
| `src/backend/shared/tauri/` | Tauri `invoke()` wrapper | React, DB calls |
| `src/backend/modules/<mod>/domain/` | Entities, exceptions, pure rules | DB calls, Drizzle |
| `src/backend/modules/<mod>/contracts/` | **Only backend file frontend imports** | Drizzle, DB |
| `src/backend/modules/<mod>/services/` | Business logic calling repo interface | Drizzle, `next/*` |
| `src/backend/modules/<mod>/repositories/` | Drizzle queries | Services, React |
| `src/frontend/core/` | MUI theme tokens | Backend imports |
| `src/frontend/store/` | Global UI state (theme, drawer, toasts) | Server data (`clients: Client[]`) |
| `src/frontend/shared/layouts/` | Layouts used by ≥ 2 modules | Feature-specific logic |
| `src/frontend/modules/<mod>/layouts/` | Layout for this module only | Global state |
| `src/frontend/modules/<mod>/feature-*/` | Feature hooks, feature state, components | Global state mutations |

---

## PART 3 — Code Placement Guide

> Use this table to answer "where does this file go?" for every new file you create.

| What you're creating | Where it goes | May import from |
|---|---|---|
| Next.js route page | `src/app/(dashboard)/<route>/page.tsx` | `@/frontend/shared/layouts/`, `@/frontend/modules/` |
| Root layout | `src/app/layout.tsx` | `@/frontend/core/theme`, `@/frontend/store/`, `@/bootstrap/`, `@/backend/shared/tauri/` |
| App startup logic | `src/bootstrap/` | `@/backend/config/`, `@/backend/core/`, `@/backend/di/` |
| MUI theme tokens | `src/frontend/core/theme.ts` | Only `@mui/material/styles` |
| Global UI state | `src/frontend/store/ui-store.ts` | `zustand`, `@/frontend/shared/` |
| Layout used by ≥ 2 modules | `src/frontend/shared/layouts/<name>/` | `@/frontend/store/`, `@/frontend/core/`, `@/frontend/shared/ui/` |
| Reusable MUI component | `src/frontend/shared/ui/<Name>.tsx` | MUI, `@/frontend/core/`, `@/frontend/shared/hooks/` |
| Reusable hook | `src/frontend/shared/hooks/use<Name>.ts` | React, `@/frontend/shared/utils/` |
| Pure utility function | `src/frontend/shared/utils/<name>.ts` | Nothing (pure) |
| Module-specific layout | `src/frontend/modules/<mod>/layouts/<Name>Layout.tsx` | `@/frontend/shared/layouts/`, MUI |
| Feature state store | `src/frontend/modules/<mod>/<feat>/application/<name>-store.ts` | `zustand`, backend **types** only |
| Feature data hook | `src/frontend/modules/<mod>/<feat>/application/use-<name>.ts` | backend `contracts/` + feature store |
| Feature UI component | `src/frontend/modules/<mod>/<feat>/components/<Name>.tsx` | MUI, feature hooks, `@/frontend/shared/ui/` |
| Page fragment (section) | `src/frontend/modules/<mod>/<feat>/sections/<Name>Section.tsx` | Feature components, feature hooks |
| Domain entity/value types | `src/backend/modules/<mod>/domain/entities.ts` | Pure TS only |
| Domain exceptions | `src/backend/modules/<mod>/domain/exceptions.ts` | `@/backend/core/exceptions` |
| Domain business rules | `src/backend/modules/<mod>/domain/rules.ts` | Own entities only |
| Zod DTO / filter schema | `src/backend/modules/<mod>/dto/<name>.dto.ts` | `zod` |
| Repository interface | `src/backend/modules/<mod>/repositories/<name>.repository.ts` | Own domain types, `@/backend/core/` |
| Repository Drizzle impl | `src/backend/modules/<mod>/repositories/drizzle-<name>.repository.ts` | `drizzle-orm`, `@/backend/config/db`, `@/backend/config/schema` |
| Application service | `src/backend/modules/<mod>/services/<action>-<entity>.service.ts` | Repository interface, domain types, `@/backend/core/tracing` |
| **Module contract** | `src/backend/modules/<mod>/contracts/<name>.contract.ts` | `@/backend/core/service-invoker`, `@/backend/shared/tauri/ipc-client` |
| Backend utility (cross-module) | `src/backend/shared/` | `@/backend/core/` |
| DB schema | `src/backend/config/schema.ts` | `drizzle-orm/sqlite-core` |
| DI container | `src/backend/di/container.ts` | All backend services + repositories |
| Unit test (domain) | `src/backend/modules/<mod>/tests/unit/*.test.ts` | Module domain only |
| Repository test | `tests/repository/*.test.ts` | `@/backend/config/`, repositories |
| Integration test | `tests/integration/*.test.ts` | `@/backend/di/container`, `@/bootstrap/` |
| E2E test | `tests/e2e/*.spec.ts` | Playwright only |
| Rust native command | `src-tauri/src/commands/<name>.rs` | `rusqlite`, `tauri` |
| Custom ESLint rule | `tools/eslint-rules/<name>.js` | Node.js only |

---

## PART 4 — Tauri Rust Layer

### 4.1 Cargo.toml

```toml
[package]
name = "client-manager-desktop"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "1", features = [] }

[dependencies]
tauri              = { version = "1", features = ["dialog-all", "fs-all", "path-all"] }
serde              = { version = "1", features = ["derive"] }
serde_json         = "1"
rusqlite           = { version = "0.31", features = ["bundled"] }
tracing            = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
tracing-appender   = "0.2"
dirs               = "5"
thiserror          = "1"

[features]
custom-protocol = ["tauri/custom-protocol"]
```

### 4.2 Error Type

```rust
// src-tauri/src/error.rs
use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("IO error: {0}")]         Io(String),
    #[error("Database error: {0}")]   Database(String),
    #[error("Integrity check: {0}")] Integrity(String),
    #[error("Not found: {0}")]       NotFound(String),
    #[error("Unexpected: {0}")]      Unexpected(String),
}

#[derive(Serialize)]
struct SerializedError { code: String, message: String }

impl Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        let code = match self {
            AppError::Io(_)         => "IO",
            AppError::Database(_)   => "DATABASE",
            AppError::Integrity(_)  => "INTEGRITY",
            AppError::NotFound(_)   => "NOT_FOUND",
            AppError::Unexpected(_) => "UNEXPECTED",
        };
        SerializedError { code: code.into(), message: self.to_string() }.serialize(s)
    }
}
```

### 4.3 Database Commands

```rust
// src-tauri/src/commands/database.rs
use std::env;

#[tauri::command]
pub fn get_db_path() -> String {
    env::var("DB_PATH").unwrap_or_else(|_| "./client-manager.db".into())
}

#[tauri::command]
pub fn get_db_size() -> Result<u64, String> {
    let path = env::var("DB_PATH").map_err(|e| e.to_string())?;
    Ok(std::fs::metadata(&path).map_err(|e| e.to_string())?.len())
}

#[tauri::command]
pub fn write_log(entry: serde_json::Value) -> Result<(), String> {
    tracing::info!(target: "ui", "{}", entry);
    Ok(())
}
```

### 4.4 tauri.conf.json

```json
{
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:3000",
    "distDir": "../out"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "dialog": { "all": true },
      "fs":     { "all": true, "scope": ["$APPDATA/*", "$DOCUMENT/*"] },
      "path":   { "all": true }
    },
    "bundle": {
      "active": true,
      "identifier": "com.yourcompany.clientmanager",
      "targets": ["msi", "nsis"],
      "windows": { "webviewInstallMode": { "type": "downloadBootstrapper" } }
    }
  }
}
```

### 4.5 next.config.ts

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const config: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  // No rewrites, no API routes. Static export only.
};

export default config;
```

---

## PART 5 — Core Utilities

### 5.1 Exceptions

```typescript
// src/backend/core/exceptions.ts
export class ApplicationError extends Error {
  constructor(public code: string, message: string, public cause?: unknown) {
    super(message);
    this.name = this.constructor.name;
  }
}
export class NotFoundError extends ApplicationError {
  constructor(m: string) { super('NOT_FOUND', m); }
}
export class SchemaIncompatibleError extends ApplicationError {
  constructor(m: string) { super('SCHEMA_INCOMPATIBLE', m); }
}
```

### 5.2 Result Type

```typescript
// src/backend/core/result.ts
import type { ApplicationError } from './exceptions';
export type Result<T, E = ApplicationError> =
  | { ok: true;  value: T }
  | { ok: false; error: E };
```

### 5.3 Pagination

```typescript
// src/backend/core/pagination.ts
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
}
```

---

## PART 6 — Tracing and Observability

### 6.1 Frontend Structured Logger

```typescript
// src/backend/core/tracing.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogCategory = 'application' | 'database' | 'backup' | 'migration' | 'ipc' | 'ui';

interface LogEntry {
  ts: string; level: LogLevel; category: LogCategory;
  message: string; payload?: Record<string, unknown>; spanId?: string;
}

const isDev = process.env.NODE_ENV !== 'production';

class Logger {
  private emit(entry: LogEntry): void {
    if (isDev) {
      const fn = entry.level === 'error' ? console.error
               : entry.level === 'warn'  ? console.warn
               : console.log;
      fn(`[${entry.ts}] [${entry.category}] ${entry.level.toUpperCase()} ${entry.message}`, entry.payload ?? '');
    }
    // In prod: fire-and-forget to Tauri file logger
    if (!isDev && typeof window !== 'undefined') {
      import('@tauri-apps/api/core')
        .then(({ invoke }) => invoke('write_log', { entry }).catch(() => {}))
        .catch(() => {});
    }
  }

  private ts() { return new Date().toISOString(); }

  debug(m: string, p?: Record<string, unknown>) { this.emit({ ts: this.ts(), level: 'debug', category: 'application', message: m, payload: p }); }
  info (m: string, p?: Record<string, unknown>) { this.emit({ ts: this.ts(), level: 'info',  category: 'application', message: m, payload: p }); }
  warn (m: string, p?: Record<string, unknown>) { this.emit({ ts: this.ts(), level: 'warn',  category: 'application', message: m, payload: p }); }
  error(m: string, p?: Record<string, unknown>) { this.emit({ ts: this.ts(), level: 'error', category: 'application', message: m, payload: p }); }

  category(cat: LogCategory) {
    return {
      debug: (m: string, p?: Record<string, unknown>) => this.emit({ ts: this.ts(), level: 'debug', category: cat, message: m, payload: p }),
      info:  (m: string, p?: Record<string, unknown>) => this.emit({ ts: this.ts(), level: 'info',  category: cat, message: m, payload: p }),
      warn:  (m: string, p?: Record<string, unknown>) => this.emit({ ts: this.ts(), level: 'warn',  category: cat, message: m, payload: p }),
      error: (m: string, p?: Record<string, unknown>) => this.emit({ ts: this.ts(), level: 'error', category: cat, message: m, payload: p }),
    };
  }

  startSpan(name: string) {
    const spanId = crypto.randomUUID();
    const start = Date.now();
    this.emit({ ts: this.ts(), level: 'debug', category: 'application', message: `span.start: ${name}`, spanId });
    return {
      end: (opts?: { status?: 'ok' | 'error'; error?: string }) => {
        this.emit({ ts: this.ts(), level: 'debug', category: 'application',
          message: `span.end: ${name}`, spanId, payload: { durationMs: Date.now() - start, ...opts } });
      },
    };
  }
}

export const logger = new Logger();
```

### 6.2 Rust Tracing Setup

```toml
# src-tauri/Cargo.toml (relevant deps)
[dependencies]
tracing            = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
tracing-appender   = "0.2"
```

```rust
// src-tauri/src/tracing_setup.rs
use tracing_subscriber::{fmt, prelude::*, EnvFilter};
use tracing_appender::rolling;

pub fn init_tracing() {
    let log_dir = std::env::var("LOG_DIR").unwrap_or_else(|_| {
        dirs::data_dir()
            .map(|p| p.join("client-manager-desktop/logs").to_string_lossy().to_string())
            .unwrap_or_else(|| "./logs".into())
    });

    let file_appender = rolling::daily(&log_dir, "app.log");
    let (file_writer, guard) = tracing_appender::non_blocking(file_appender);
    std::mem::forget(guard); // Keep alive for app lifetime

    let filter = EnvFilter::try_from_default_env().unwrap_or_else(|_| {
        EnvFilter::new("info,application=debug,backup=debug,database=debug,migration=debug,ipc=debug,ui=info")
    });

    tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(false).with_writer(std::io::stdout))
        .with(fmt::layer().json().with_writer(file_writer))
        .init();

    tracing::info!(target: "application", "tracing initialized");
}

pub fn tracing_span(name: &str) -> tracing::Span {
    tracing::info_span!("operation", name = name)
}
```

### 6.3 Log Categories

| Category | Where used |
|---|---|
| `application` | Bootstrap, startup events, unexpected errors |
| `database` | Connection init, migration runs |
| `backup` | Backup create/restore/verify operations |
| `migration` | Migration runner steps |
| `ipc` | Tauri `invoke()` call boundaries |
| `ui` | Render errors, user-visible warnings |

---

## PART 7 — Drizzle ORM Setup

### 7.1 Why Drizzle Over Prisma (Desktop Context)

| Concern | Prisma | Drizzle |
|---|---|---|
| Runtime binary query engine | Required (~5–10 MB) | Not required |
| Tauri compatibility | Workarounds needed | Native, no hacks |
| Bundle size | Larger | Smaller |
| SQL control | Abstracted | Closer to raw SQL |
| Type safety | Generated client | Inferred from schema |

### 7.2 Drizzle Configuration

```typescript
// drizzle.config.ts  (project root)
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/backend/config/schema.ts',  // ← backend folder
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'better-sqlite3',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? './dev.db',
  },
  verbose: true,
  strict: true,
});
```

### 7.3 Schema Definition

```typescript
// src/backend/config/schema.ts
import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const clients = sqliteTable('clients', {
  id:         text('id').primaryKey(),
  firstName:  text('first_name').notNull(),
  lastName:   text('last_name').notNull(),
  phone:      text('phone'),
  email:      text('email'),
  archived:   integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt:  integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  updatedAt:  integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
}, (t) => ({
  lastNameIdx: index('idx_clients_last_name').on(t.lastName),
  createdAtIdx: index('idx_clients_created_at').on(t.createdAt),
  emailIdx:    index('idx_clients_email').on(t.email),
}));

/** Used by version-guard — tracks which schema version this DB was last opened with */
export const schemaMeta = sqliteTable('schema_meta', {
  key:   text('key').primaryKey(),
  value: text('value').notNull(),
});
```

### 7.4 Drizzle Client Singleton

```typescript
// src/backend/config/db.ts
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';
import { logger } from '@/backend/core/tracing';

let _db: BetterSQLite3Database<typeof schema> | null = null;
let _sqlite: Database.Database | null = null;

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!_db) throw new Error('Database not initialised. Call initDatabase() during bootstrap.');
  return _db;
}

export function getRawSqlite(): Database.Database {
  if (!_sqlite) throw new Error('Database not initialised.');
  return _sqlite;
}

export function initDatabase(dbPath: string): void {
  logger.info('database.initializing', { path: dbPath });
  _sqlite = new Database(dbPath);
  _sqlite.pragma('journal_mode = WAL');
  _sqlite.pragma('foreign_keys = ON');
  _sqlite.pragma('synchronous = NORMAL');
  _db = drizzle(_sqlite, { schema });
  logger.info('database.ready', { path: dbPath });
}

export function closeDatabase(): void {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
    logger.info('database.closed');
  }
}
```

### 7.5 Environment Constants

```typescript
// src/backend/config/env.ts
export const APP_SCHEMA_VERSION = 2;           // bump on every schema-affecting release
export const MIN_COMPATIBLE_SCHEMA_VERSION = 1; // oldest DB version this app can open
```

---

## PART 8 — Complete Client Module Implementation

### 8.1 Domain Layer

```typescript
// src/backend/modules/(core-domain)/clients/domain/entities.ts
export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientCreateData {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
}

export interface ClientUpdateData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  archived?: boolean;
}
```

```typescript
// src/backend/modules/(core-domain)/clients/domain/exceptions.ts
import { ApplicationError } from '@/backend/core/exceptions';

export class ClientValidationError extends ApplicationError {
  constructor(message: string, public field?: string) { super('CLIENT_VALIDATION', message); }
}
export class ClientAlreadyExistsError extends ApplicationError {
  constructor(email: string) { super('CLIENT_EXISTS', `Client with email ${email} already exists`); }
}
export class ClientNotFoundError extends ApplicationError {
  constructor(id: string) { super('CLIENT_NOT_FOUND', `Client ${id} not found`); }
}
```

```typescript
// src/backend/modules/(core-domain)/clients/domain/rules.ts
import type { Client } from './entities';

export function validateClientName(name: string): boolean {
  const t = name.trim();
  return t.length > 0 && t.length <= 100;
}

export function validateEmailFormat(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePhoneFormat(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

export function getClientFullName(c: Pick<Client, 'firstName' | 'lastName'>): string {
  return `${c.firstName} ${c.lastName}`.trim();
}

export function sortClientsByName(clients: Client[]): Client[] {
  return [...clients].sort((a, b) => {
    const ln = a.lastName.localeCompare(b.lastName);
    return ln !== 0 ? ln : a.firstName.localeCompare(b.firstName);
  });
}
```

### 8.2 Services

```typescript
// src/backend/modules/(core-domain)/clients/services/create-client.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import type { Client, ClientCreateData } from '../domain/entities';
import { ClientAlreadyExistsError, ClientValidationError } from '../domain/exceptions';
import { validateClientName, validateEmailFormat, validatePhoneFormat } from '../domain/rules';
import { logger } from '@/backend/core/tracing';

export class CreateClientService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(data: ClientCreateData): Promise<Client> {
    logger.info('client.create.start', { email: data.email });
    if (!validateClientName(data.firstName)) throw new ClientValidationError('First name required (max 100)', 'firstName');
    if (!validateClientName(data.lastName))  throw new ClientValidationError('Last name required (max 100)', 'lastName');
    if (data.email && !validateEmailFormat(data.email)) throw new ClientValidationError('Invalid email', 'email');
    if (data.phone && !validatePhoneFormat(data.phone)) throw new ClientValidationError('Invalid phone', 'phone');
    if (data.email && await this.repo.existsByEmail(data.email)) throw new ClientAlreadyExistsError(data.email);
    const created = await this.repo.save(data);
    logger.info('client.create.success', { id: created.id });
    return created;
  }
}
```

```typescript
// src/backend/modules/(core-domain)/clients/services/update-client.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import type { ClientUpdateData } from '../domain/entities';
import { ClientNotFoundError, ClientValidationError } from '../domain/exceptions';
import { validateClientName, validateEmailFormat, validatePhoneFormat } from '../domain/rules';
import { logger } from '@/backend/core/tracing';

export class UpdateClientService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(id: string, data: ClientUpdateData) {
    const existing = await this.repo.getById(id);
    if (!existing) throw new ClientNotFoundError(id);
    if (data.firstName !== undefined && !validateClientName(data.firstName)) throw new ClientValidationError('First name invalid', 'firstName');
    if (data.lastName  !== undefined && !validateClientName(data.lastName))  throw new ClientValidationError('Last name invalid', 'lastName');
    if (data.email !== undefined && data.email && !validateEmailFormat(data.email)) throw new ClientValidationError('Invalid email', 'email');
    if (data.phone !== undefined && data.phone && !validatePhoneFormat(data.phone)) throw new ClientValidationError('Invalid phone', 'phone');
    if (data.email && data.email !== existing.email && await this.repo.existsByEmail(data.email, id))
      throw new ClientValidationError('Email already in use', 'email');
    const updated = await this.repo.update(id, data);
    logger.info('client.update.success', { id });
    return updated;
  }
}
```

```typescript
// src/backend/modules/(core-domain)/clients/services/delete-client.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import { ClientNotFoundError } from '../domain/exceptions';
import { logger } from '@/backend/core/tracing';

export class DeleteClientService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(id: string): Promise<void> {
    if (!await this.repo.getById(id)) throw new ClientNotFoundError(id);
    await this.repo.delete(id);
    logger.info('client.delete.success', { id });
  }
}
```

```typescript
// src/backend/modules/(core-domain)/clients/services/search-clients.service.ts
import type { ClientRepository } from '../repositories/client.repository';
import type { ClientFilters } from '../dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';
import type { Client } from '../domain/entities';
import { logger } from '@/backend/core/tracing';

export class SearchClientsService {
  constructor(private readonly repo: ClientRepository) {}

  async execute(filters: ClientFilters): Promise<PaginatedResult<Client>> {
    logger.debug('search.clients', { filters });
    return this.repo.search(filters);
  }
}
```

---

## PART 9 — Search Filtering (DB-Level)

### 9.1 Anti-Pattern Removed

```typescript
// ❌ OLD — loads everything, then filters in memory
const { items } = await repo.listPaginated(page, size);
const filtered = filterClientsByQuery(items, query);
```

Filtering, pagination, and sorting now happen in a **single SQL query**.

### 9.2 Filters DTO

```typescript
// src/backend/modules/(core-domain)/clients/dto/client-filters.dto.ts
import { z } from 'zod';

export const clientFiltersSchema = z.object({
  query:   z.string().trim().optional(),
  archived: z.boolean().optional(),
  page:    z.number().int().min(1).default(1),
  size:    z.number().int().min(1).max(100).default(20),
  sortBy:  z.enum(['lastName', 'createdAt']).default('lastName'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
});

export type ClientFilters = z.infer<typeof clientFiltersSchema>;
```

### 9.3 Generated SQL

For `query="john", page=2, size=20, sortBy=lastName, sortDir=desc`:

```sql
SELECT * FROM clients
WHERE (LOWER(first_name) LIKE '%john%' OR LOWER(last_name) LIKE '%john%'
    OR LOWER(email) LIKE '%john%'       OR LOWER(phone)  LIKE '%john%')
ORDER BY last_name DESC
LIMIT 20 OFFSET 20;

SELECT COUNT(*) FROM clients WHERE (...same conditions...);
```

Only the requested page's rows are loaded into memory.

### 9.4 Index Coverage

- `idx_clients_last_name` — default sort
- `idx_clients_email` — uniqueness checks + email search
- `idx_clients_created_at` — "recently added" sort

For large datasets where `LIKE '%term%'` becomes slow, a future migration can add FTS5 virtual tables.

---

## PART 10 — Repository Pattern Enforcement

### 10.1 The Rule

> **Services MUST NOT import `drizzle-orm`, `better-sqlite3`, or any file from `@/backend/config/schema` or `@/backend/config/db`. They depend only on repository interfaces.**

### 10.2 Repository Interface

```typescript
// src/backend/modules/(core-domain)/clients/repositories/client.repository.ts
import type { Client, ClientCreateData, ClientUpdateData } from '../domain/entities';
import type { ClientFilters } from '../dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';

export interface ClientRepository {
  getById(id: string): Promise<Client | null>;
  getByEmail(email: string): Promise<Client | null>;
  search(filters: ClientFilters): Promise<PaginatedResult<Client>>;
  existsByEmail(email: string, excludeId?: string): Promise<boolean>;
  save(data: ClientCreateData): Promise<Client>;
  update(id: string, data: ClientUpdateData): Promise<Client>;
  delete(id: string): Promise<void>;
  count(): Promise<number>;
}
```

### 10.3 Drizzle Implementation

```typescript
// src/backend/modules/(core-domain)/clients/repositories/drizzle-client.repository.ts
import { eq, and, ilike, or, sql, desc, asc } from 'drizzle-orm';
import { getDb } from '@/backend/config/db';
import { clients } from '@/backend/config/schema';
import type { ClientRepository } from './client.repository';
import type { Client, ClientCreateData, ClientUpdateData } from '../domain/entities';
import type { ClientFilters } from '../dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';
import { mapRowToClient } from './mappers';

export class DrizzleClientRepository implements ClientRepository {
  private get db() { return getDb(); }

  async getById(id: string): Promise<Client | null> {
    const rows = await this.db.select().from(clients).where(eq(clients.id, id)).limit(1);
    return rows[0] ? mapRowToClient(rows[0]) : null;
  }

  async getByEmail(email: string): Promise<Client | null> {
    const rows = await this.db.select().from(clients)
      .where(eq(clients.email, email.toLowerCase())).limit(1);
    return rows[0] ? mapRowToClient(rows[0]) : null;
  }

  async search(filters: ClientFilters): Promise<PaginatedResult<Client>> {
    const page = Math.max(1, filters.page ?? 1);
    const size = Math.min(100, Math.max(1, filters.size ?? 20));
    const offset = (page - 1) * size;

    const conditions = [];
    if (filters.query) {
      const term = `%${filters.query.toLowerCase()}%`;
      conditions.push(or(
        ilike(clients.firstName, term),
        ilike(clients.lastName, term),
        ilike(clients.email, term),
        ilike(clients.phone, term),
      )!);
    }
    if (filters.archived !== undefined) conditions.push(eq(clients.archived, filters.archived));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const orderBy =
      filters.sortBy === 'createdAt'
        ? filters.sortDir === 'asc' ? asc(clients.createdAt) : desc(clients.createdAt)
        : filters.sortDir === 'asc' ? asc(clients.lastName)  : desc(clients.lastName);

    const [rows, totalRows] = await Promise.all([
      this.db.select().from(clients).where(where).orderBy(orderBy).limit(size).offset(offset),
      this.db.select({ count: sql<number>`count(*)` }).from(clients).where(where),
    ]);

    const total = totalRows[0]?.count ?? 0;
    return { items: rows.map(mapRowToClient), total, page, size, totalPages: Math.ceil(total / size) };
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const cond = excludeId !== undefined
      ? and(eq(clients.email, email.toLowerCase()), sql`${clients.id} != ${excludeId}`)
      : eq(clients.email, email.toLowerCase());
    const rows = await this.db.select({ id: clients.id }).from(clients).where(cond).limit(1);
    return rows.length > 0;
  }

  async save(data: ClientCreateData): Promise<Client> {
    const id = crypto.randomUUID();
    const [row] = await this.db.insert(clients).values({
      id,
      firstName: data.firstName.trim(),
      lastName:  data.lastName.trim(),
      phone:     data.phone?.trim() ?? null,
      email:     data.email?.toLowerCase().trim() ?? null,
    }).returning();
    return mapRowToClient(row);
  }

  async update(id: string, data: ClientUpdateData): Promise<Client> {
    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (data.firstName !== undefined) patch.firstName = data.firstName.trim();
    if (data.lastName  !== undefined) patch.lastName  = data.lastName.trim();
    if (data.phone     !== undefined) patch.phone     = data.phone.trim() || null;
    if (data.email     !== undefined) patch.email     = data.email.toLowerCase().trim() || null;
    const [row] = await this.db.update(clients).set(patch).where(eq(clients.id, id)).returning();
    if (!row) throw new Error(`Client ${id} not found`);
    return mapRowToClient(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(clients).where(eq(clients.id, id));
  }

  async count(): Promise<number> {
    const rows = await this.db.select({ count: sql<number>`count(*)` }).from(clients);
    return rows[0]?.count ?? 0;
  }
}
```

### 10.4 Row Mapper

```typescript
// src/backend/modules/(core-domain)/clients/repositories/mappers.ts
import type { Client } from '../domain/entities';

type ClientRow = {
  id: string; firstName: string; lastName: string;
  phone: string | null; email: string | null;
  archived: boolean; createdAt: Date; updatedAt: Date;
};

export function mapRowToClient(row: ClientRow): Client {
  return {
    id: row.id, firstName: row.firstName, lastName: row.lastName,
    phone: row.phone, email: row.email, archived: row.archived,
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  };
}
```

### 10.5 Dependency Injection Container

```typescript
// src/backend/di/container.ts
import { DrizzleClientRepository } from '@/backend/modules/(core-domain)/clients/repositories/drizzle-client.repository';
import { CreateClientService }  from '@/backend/modules/(core-domain)/clients/services/create-client.service';
import { UpdateClientService }  from '@/backend/modules/(core-domain)/clients/services/update-client.service';
import { DeleteClientService }  from '@/backend/modules/(core-domain)/clients/services/delete-client.service';
import { SearchClientsService } from '@/backend/modules/(core-domain)/clients/services/search-clients.service';
import { CreateBackupService }  from '@/backend/modules/(operations)/backup/services/create-backup.service';
import { RestoreBackupService } from '@/backend/modules/(operations)/backup/services/restore-backup.service';

// Single shared repository instance — all services for the same entity share it.
const clientRepo = new DrizzleClientRepository();

export const container = {
  createClientService:  new CreateClientService(clientRepo),
  updateClientService:  new UpdateClientService(clientRepo),
  deleteClientService:  new DeleteClientService(clientRepo),
  searchClientsService: new SearchClientsService(clientRepo),
  createBackupService:  new CreateBackupService(),
  restoreBackupService: new RestoreBackupService(),
} as const;

export type Container = typeof container;
```

### 10.6 ESLint Enforcement

```js
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
        ].some((p) => src === p || src.startsWith(p + '/'));
        if (!isDrizzle) return;
        const filename = context.getFilename();
        if (!filename.endsWith('.repository.ts') && !filename.includes('/repositories/')) {
          context.report(node, 'Drizzle imports are only allowed inside repositories/');
        }
      },
    };
  },
};
```

---

## PART 11 — ESLint Boundary Enforcement

```js
// eslint.config.js
import { no_drizzle_outside_repos } from './tools/eslint-rules/no-drizzle-outside-repos.js';

export default [
  {
    rules: {
      // No relative-URL fetch() calls — everything goes through invokeService or contracts
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
    // Frontend must only touch backend via contracts (or plain types)
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
    // bootstrap/ must not import React or Next.js
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
```

---

## PART 12 — Communication Flow (No REST API)

### 12.1 Production Runtime Reality

With `output: 'export'`, Next.js produces only static HTML/JS/CSS. There is **no Node.js server** in production. Therefore:

- No `fetch('/api/...')` calls anywhere in the codebase.
- No `app/api/**` route handlers — that folder does not exist.
- Application services run **in the same JS process** as the React UI (Tauri's webview context).
- Native operations (backup, restore, DB path resolution) go through `invoke()`.

### 12.2 Standard Data Flow

```
React Component  (src/frontend/modules/.../feature-*/sections/)
     │
     ▼
Feature Hook     (src/frontend/modules/.../feature-*/application/use-*.ts)
     │
     ▼
Module Contract  (src/backend/modules/<mod>/contracts/<name>.contract.ts)
     │
     ▼
Service Invoker  (src/backend/core/service-invoker.ts — in-process, no HTTP)
     │
     ▼
Application Service  (src/backend/modules/<mod>/services/)
     │
     ▼
Repository Interface (src/backend/modules/<mod>/repositories/<name>.repository.ts)
     │
     ▼
Drizzle Repository   (drizzle-<name>.repository.ts)
     │
     ▼
Drizzle Client  (src/backend/config/db.ts — better-sqlite3 driver)
     │
     ▼
SQLite file  (app_data_dir/client-manager.db)
```

### 12.3 Native Operation Flow (Backup / Restore)

```
Feature Hook
     │
     ▼
Backup Contract  (src/backend/modules/(operations)/backup/contracts/backup.contract.ts)
     │
     ▼
Tauri IPC Client  (src/backend/shared/tauri/ipc-client.ts)
     │
     ▼  invoke('create_backup', { dbPath, targetPath })
Tauri Rust Command  (src-tauri/src/commands/backup.rs)
     │
     ▼  rusqlite VACUUM INTO
Consistent backup file on disk
```

### 12.4 Import Boundary Rules

| Layer | May import from | Must NOT import from |
|---|---|---|
| `frontend/modules/*/feature-*` | module `contracts/`, `frontend/shared/`, `frontend/store/`, `frontend/core/` | `services/`, `repositories/`, `backend/config/` |
| `backend/modules/*/contracts/` | `backend/core/service-invoker`, `backend/shared/tauri/ipc-client`, own module types | `drizzle-orm`, `better-sqlite3` |
| `backend/modules/*/services/` | own domain + repo interface, `backend/core/` | `drizzle-orm`, `better-sqlite3`, `next/*` |
| `backend/modules/*/repositories/` | `drizzle-orm`, `backend/config/db`, `backend/config/schema` | services, frontend |
| `frontend/store/` | `frontend/shared/` | `backend/`, feature stores |
| `bootstrap/` | `backend/config/`, `backend/core/`, `backend/di/` | React, JSX |

### 12.5 Service Invoker

```typescript
// src/backend/core/service-invoker.ts
import { container } from '@/backend/di/container';
import { logger } from '@/backend/core/tracing';
import { ApplicationError } from '@/backend/core/exceptions';
import type { Result } from '@/backend/core/result';

/**
 * In-process invocation of an application service.
 * The only way the frontend calls backend services — no HTTP involved.
 */
export async function invokeService<TArgs extends unknown[], TResult>(
  serviceKey: keyof typeof container,
  method: string,
  ...args: TArgs
): Promise<Result<TResult, ApplicationError>> {
  const span = logger.startSpan(`service:${String(serviceKey)}.${method}`);
  try {
    const service = container[serviceKey] as Record<string, (...a: TArgs) => Promise<TResult>>;
    if (!service || typeof service[method] !== 'function') {
      throw new Error(`Service ${String(serviceKey)}.${method} not registered`);
    }
    const data = await service[method](...args);
    span.end({ status: 'ok' });
    return { ok: true, value: data };
  } catch (err) {
    span.end({ status: 'error', error: String(err) });
    logger.error('service.invocation.failed', { service: serviceKey, method, error: err });
    return {
      ok: false,
      error: err instanceof ApplicationError ? err : new ApplicationError('UNEXPECTED', String(err)),
    };
  }
}
```

### 12.6 Tauri IPC Client

```typescript
// src/backend/shared/tauri/ipc-client.ts
import { invoke as tauriInvoke } from '@tauri-apps/api/core';
import { logger } from '@/backend/core/tracing';

/**
 * Typed wrapper around Tauri's invoke().
 * Only module contracts may import this — not feature hooks, not components.
 */
export async function invoke<T>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const span = logger.startSpan(`ipc:${command}`);
  try {
    const result = await tauriInvoke<T>(command, args);
    span.end({ status: 'ok' });
    return result;
  } catch (err) {
    span.end({ status: 'error', error: String(err) });
    logger.category('ipc').error('ipc.command.failed', { command, error: err });
    throw err;
  }
}
```

### 12.7 Enforcement

| Rule | Enforced by |
|---|---|
| No `fetch('/...')` anywhere | Custom ESLint rule in `eslint.config.js` |
| No `drizzle-orm` outside `repositories/` | `tools/eslint-rules/no-drizzle-outside-repos.js` |
| Frontend cannot import `services/` or `repositories/` | `no-restricted-imports` in `eslint.config.js` |
| `bootstrap/` cannot import React | TypeScript `noEmit` + ESLint `no-restricted-imports` |

---

## PART 13 — Backup Strategy (SQLite-Safe)

### 13.1 Problem With File Copy

Copying `.db`, `.db-wal`, `.db-shm` separately can produce an inconsistent snapshot if a write occurs mid-copy. The WAL and SHM files are interdependent.

### 13.2 Solution: `VACUUM INTO`

`VACUUM INTO` produces a single, transactionally-consistent snapshot. It locks the source briefly, writes a complete defragmented copy, and does not modify the source. The output is safe to copy, email, or restore on any machine.

### 13.3 Backup Contract (Frontend-Facing)

```typescript
// src/backend/modules/(operations)/backup/contracts/backup.contract.ts
import { invoke } from '@/backend/shared/tauri/ipc-client';

/**
 * Public surface for all backup operations.
 * Feature hooks call this — never import ipc-client directly from the frontend.
 */
export const backupContract = {
  async create(dbPath: string, targetPath: string): Promise<{ path: string }> {
    const path = await invoke<string>('create_backup', { dbPath, targetPath });
    return { path };
  },
  async restore(backupPath: string, targetPath: string): Promise<void> {
    await invoke<void>('restore_backup', { backupPath, targetPath });
  },
  async verify(path: string): Promise<boolean> {
    return invoke<boolean>('verify_backup', { path });
  },
  async getDbPath(): Promise<string> {
    return invoke<string>('get_db_path');
  },
};
```

### 13.4 Rust Backup Command

```rust
// src-tauri/src/commands/backup.rs
use rusqlite::Connection;
use std::path::PathBuf;
use crate::error::AppError;
use crate::tracing_setup::tracing_span;

#[tauri::command]
pub fn create_backup(db_path: String, target_path: String) -> Result<String, AppError> {
    let _span = tracing_span("backup.create");
    tracing::info!(target: "backup", "creating backup", from = %db_path, to = %target_path);

    if !std::path::Path::new(&db_path).exists() {
        return Err(AppError::NotFound(format!("Database not found: {}", db_path)));
    }

    let conn = Connection::open(&db_path)
        .map_err(|e| AppError::Database(format!("Open source failed: {e}")))?;

    conn.execute_batch(&format!("VACUUM INTO '{}';", target_path.replace('\'', "''")))
        .map_err(|e| AppError::Database(format!("VACUUM INTO failed: {e}")))?;

    // Integrity check on the resulting file
    let backup_conn = Connection::open(&target_path)
        .map_err(|e| AppError::Database(format!("Open backup failed: {e}")))?;
    let ok: i64 = backup_conn
        .query_row("PRAGMA integrity_check;", [], |row| {
            let v: String = row.get(0)?;
            Ok(if v == "ok" { 1 } else { 0 })
        })
        .map_err(|e| AppError::Database(format!("Integrity check failed: {e}")))?;

    if ok != 1 {
        let _ = std::fs::remove_file(&target_path);
        return Err(AppError::Integrity("Backup failed integrity check".into()));
    }

    let metadata = std::fs::metadata(&target_path)
        .map_err(|e| AppError::Io(format!("Stat backup: {e}")))?;
    if metadata.len() == 0 {
        return Err(AppError::Integrity("Backup is zero bytes".into()));
    }

    tracing::info!(target: "backup", "backup created", size_bytes = metadata.len());
    Ok(target_path)
}

#[tauri::command]
pub fn restore_backup(backup_path: String, target_path: String) -> Result<(), AppError> {
    let _span = tracing_span("backup.restore");

    if !std::path::Path::new(&backup_path).exists() {
        return Err(AppError::NotFound(format!("Backup not found: {}", backup_path)));
    }

    // Verify backup before overwriting live DB
    let conn = Connection::open(&backup_path)
        .map_err(|e| AppError::Database(format!("Open backup: {e}")))?;
    let status: String = conn
        .query_row("PRAGMA integrity_check;", [], |row| row.get(0))
        .map_err(|e| AppError::Database(format!("Integrity check: {e}")))?;
    if status != "ok" {
        return Err(AppError::Integrity(format!("Backup corrupt: {status}")));
    }

    // Snapshot current live DB before overwriting (rollback safety)
    let pre_restore = PathBuf::from(&target_path).with_extension("db.pre-restore");
    conn.execute_batch(&format!(
        "VACUUM INTO '{}';",
        pre_restore.to_string_lossy().replace('\'', "''")
    ))
    .map_err(|e| AppError::Database(format!("Pre-restore snapshot: {e}")))?;

    if let Some(parent) = std::path::Path::new(&target_path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| AppError::Io(format!("mkdir: {e}")))?;
    }
    std::fs::copy(&backup_path, &target_path)
        .map_err(|e| AppError::Io(format!("Restore copy: {e}")))?;

    tracing::info!(target: "backup", "restore complete");
    Ok(())
}

#[tauri::command]
pub fn verify_backup(path: String) -> Result<bool, AppError> {
    let conn = Connection::open(&path)
        .map_err(|e| AppError::Database(format!("Open: {e}")))?;
    let status: String = conn
        .query_row("PRAGMA integrity_check;", [], |row| row.get(0))
        .map_err(|e| AppError::Database(format!("Integrity check: {e}")))?;
    Ok(status == "ok")
}
```

### 13.5 Backup Consistency Guarantees

| Operation | Guarantee |
|---|---|
| `VACUUM INTO` | Atomic, transactionally-consistent snapshot |
| Post-backup `PRAGMA integrity_check` | Backup is structurally valid |
| Size > 0 check | Backup is not empty |
| Pre-restore snapshot | Live DB can be rolled back if restore fails mid-way |
| Pre-restore integrity check | Restore source is valid before overwriting |

---

## PART 14 — Module Contracts (Frontend–Backend Bridge)

### 14.1 Purpose

The `contracts/` folder inside each backend module is the **only** layer the frontend may import from that module. Contracts:

- Call `invokeService` for TypeScript application services
- Call `ipc-client.ts` for native Tauri commands
- Re-export only the types the frontend needs
- Are the single seam for mocking in integration tests

**Rule**: If you are writing a feature hook and need data from the backend, import from `contracts/` — not from `services/`, `repositories/`, or `domain/`.

### 14.2 Client Contract

```typescript
// src/backend/modules/(core-domain)/clients/contracts/client.contract.ts
import { invokeService } from '@/backend/core/service-invoker';
import type { Client, ClientCreateData, ClientUpdateData } from '../domain/entities';
import type { ClientFilters } from '../dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';

export const clientContract = {
  async search(filters: ClientFilters): Promise<PaginatedResult<Client>> {
    const r = await invokeService('searchClientsService', 'execute', filters);
    if (!r.ok) throw r.error;
    return r.value as PaginatedResult<Client>;
  },

  async create(data: ClientCreateData): Promise<Client> {
    const r = await invokeService('createClientService', 'execute', data);
    if (!r.ok) throw r.error;
    return r.value as Client;
  },

  async update(id: string, data: ClientUpdateData): Promise<Client> {
    const r = await invokeService('updateClientService', 'execute', id, data);
    if (!r.ok) throw r.error;
    return r.value as Client;
  },

  async delete(id: string): Promise<void> {
    const r = await invokeService('deleteClientService', 'execute', id);
    if (!r.ok) throw r.error;
  },
};
```

### 14.3 Backup Contract

```typescript
// src/backend/modules/(operations)/backup/contracts/backup.contract.ts
import { invoke } from '@/backend/shared/tauri/ipc-client';

export const backupContract = {
  async create(dbPath: string, targetPath: string): Promise<{ path: string }> {
    const path = await invoke<string>('create_backup', { dbPath, targetPath });
    return { path };
  },
  async restore(backupPath: string, targetPath: string): Promise<void> {
    await invoke<void>('restore_backup', { backupPath, targetPath });
  },
  async verify(path: string): Promise<boolean> {
    return invoke<boolean>('verify_backup', { path });
  },
  async getDbPath(): Promise<string> {
    return invoke<string>('get_db_path');
  },
};
```

### 14.4 What the Frontend May and May Not Import

| ✅ Frontend MAY import | ❌ Frontend MUST NOT import |
|---|---|
| `@/backend/modules/.../contracts/*.contract.ts` | `@/backend/modules/.../services/*.service.ts` |
| `@/backend/modules/.../domain/entities.ts` (types) | `@/backend/modules/.../repositories/*.ts` |
| `@/backend/modules/.../dto/*.dto.ts` (types) | `@/backend/config/db.ts` or `schema.ts` |
| `@/backend/core/pagination.ts` (types) | `drizzle-orm`, `better-sqlite3` |

---

## PART 15 — Migration & Startup Strategy

### 15.1 Startup Flow

```
Tauri main.rs
  → set DB_PATH env var from app_data_dir()
     │
     ▼
Frontend root layout (useEffect, runs once)
  → invoke('get_db_path')
     │
     ▼
bootstrap/app-init.ts
  1. initDatabase(dbPath)         src/backend/config/db.ts
  2. runMigrations()              src/bootstrap/migration-runner.ts
  3. assertSchemaCompatible()     src/bootstrap/version-guard.ts
     │
     ▼  Incompatible → halt, show recovery UI
     ▼  Compatible   → React renders dashboard
```

### 15.2 Version Guard

```typescript
// src/bootstrap/version-guard.ts
import { getDb } from '@/backend/config/db';
import { schemaMeta } from '@/backend/config/schema';
import { eq } from 'drizzle-orm';
import { APP_SCHEMA_VERSION, MIN_COMPATIBLE_SCHEMA_VERSION } from '@/backend/config/env';
import { logger } from '@/backend/core/tracing';
import { SchemaIncompatibleError } from '@/backend/core/exceptions';

export function readDbVersion(): number {
  const db = getDb();
  const row = db.select().from(schemaMeta).where(eq(schemaMeta.key, 'app_schema_version')).get();
  return row ? Number(row.value) : 0;
}

export function writeDbVersion(version: number): void {
  getDb()
    .insert(schemaMeta)
    .values({ key: 'app_schema_version', value: String(version) })
    .onConflictDoUpdate({ target: schemaMeta.key, set: { value: String(version) } })
    .run();
}

export function assertSchemaCompatible(): void {
  const current = readDbVersion();
  logger.info('schema.version.check', { current, expected: APP_SCHEMA_VERSION });

  if (current === 0) {
    // Fresh install — stamp the version and let migrations create the tables.
    writeDbVersion(APP_SCHEMA_VERSION);
    return;
  }
  if (current < MIN_COMPATIBLE_SCHEMA_VERSION) {
    throw new SchemaIncompatibleError(
      `DB schema v${current} is below minimum v${MIN_COMPATIBLE_SCHEMA_VERSION}. Restore a compatible backup.`
    );
  }
  if (current > APP_SCHEMA_VERSION) {
    throw new SchemaIncompatibleError(
      `DB schema v${current} is newer than this app (v${APP_SCHEMA_VERSION}). Update the application.`
    );
  }
  writeDbVersion(APP_SCHEMA_VERSION);
}
```

### 15.3 Migration Runner

```typescript
// src/bootstrap/migration-runner.ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { getDb } from '@/backend/config/db';
import { logger } from '@/backend/core/tracing';

export function runMigrations(): void {
  try {
    logger.info('migrations.start');
    migrate(getDb(), { migrationsFolder: './drizzle' });
    logger.info('migrations.complete');
  } catch (err) {
    logger.error('migrations.failed', { error: String(err) });
    throw err;
  }
}
```

### 15.4 Bootstrap Sequence

```typescript
// src/bootstrap/app-init.ts
import { initDatabase } from '@/backend/config/db';
import { runMigrations } from './migration-runner';
import { assertSchemaCompatible } from './version-guard';
import { logger } from '@/backend/core/tracing';
import { container } from '@/backend/di/container';

let initialized = false;

export async function initApp(dbPath: string): Promise<void> {
  if (initialized) return;
  logger.info('app.bootstrap.start', { dbPath });
  initDatabase(dbPath);
  runMigrations();
  assertSchemaCompatible();
  initialized = true;
  logger.info('app.bootstrap.complete');
}

export { container };
```

### 15.5 Tauri-Side Init

```rust
// src-tauri/src/main.rs (excerpt)
fn main() {
    client_manager_desktop::tracing_setup::init_tracing();
    tauri::Builder::default()
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("app_data_dir");
            std::fs::create_dir_all(&app_dir).expect("create app_data_dir");
            let db_path = app_dir.join("client-manager.db");
            std::env::set_var("DB_PATH", db_path.to_string_lossy().to_string());
            tracing::info!(target: "application", "db_path = {}", db_path.display());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            client_manager_desktop::commands::backup::create_backup,
            client_manager_desktop::commands::backup::restore_backup,
            client_manager_desktop::commands::backup::verify_backup,
            client_manager_desktop::commands::database::get_db_path,
            client_manager_desktop::commands::database::get_db_size,
            client_manager_desktop::commands::database::write_log,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### 15.6 Migration Authoring Workflow

```
1. Change src/backend/config/schema.ts
2. npm run db:generate     →  drizzle/00XX_<description>.sql is generated
3. Commit both the schema change AND the migration SQL together
4. On next app start, runMigrations() applies it automatically
```

### 15.7 Rollback Reference

| Scenario | Action |
|---|---|
| Failed migration at startup | Schema guard halts app; user restores a backup |
| Schema version too old | App refuses to start; displays recovery UI |
| User-initiated downgrade | Restore a backup taken under the older schema |

---

## PART 16 — Testing Strategy

### 16.1 Four Layers

| Layer | What | Tool | Location |
|---|---|---|---|
| Unit | Domain rules, validators, pure services | Vitest | `src/backend/modules/**/tests/unit/` |
| Repository | DB queries, filtering, pagination | Vitest + in-memory SQLite | `tests/repository/` |
| Integration | Service → Repository → temp DB file | Vitest | `tests/integration/` |
| E2E | Full desktop workflows | Playwright (Tauri WebDriver) | `tests/e2e/` |

### 16.2 Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  test: {
    environment: 'node',
    include: [
      'tests/**/*.test.ts',
      'src/backend/modules/**/tests/**/*.test.ts',  // module-collocated tests
    ],
    setupFiles: ['./tests/setup.ts'],
  },
});
```

### 16.3 Unit Test Example

```typescript
// src/backend/modules/(core-domain)/clients/tests/unit/rules.test.ts
import { describe, it, expect } from 'vitest';
import { validateEmailFormat, validatePhoneFormat, sortClientsByName } from '../../domain/rules';

describe('validateEmailFormat', () => {
  it('accepts standard emails', () => {
    expect(validateEmailFormat('john@example.com')).toBe(true);
  });
  it('rejects missing domain', () => {
    expect(validateEmailFormat('john@')).toBe(false);
  });
});

describe('sortClientsByName', () => {
  it('sorts by last name then first name', () => {
    const sorted = sortClientsByName([
      { id: '1', firstName: 'A', lastName: 'Z', phone: null, email: null, archived: false, createdAt: new Date(), updatedAt: new Date() },
      { id: '2', firstName: 'B', lastName: 'A', phone: null, email: null, archived: false, createdAt: new Date(), updatedAt: new Date() },
    ]);
    expect(sorted[0].id).toBe('2');
  });
});
```

### 16.4 Repository Test Example

```typescript
// tests/repository/client.repository.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from '@/backend/config/schema';
import { DrizzleClientRepository } from '@/backend/modules/(core-domain)/clients/repositories/drizzle-client.repository';

let sqlite: Database.Database;

beforeEach(() => {
  sqlite = new Database(':memory:');
  sqlite.pragma('journal_mode = WAL');
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: './drizzle' });
  (process as any).__TEST_DB__ = db;
});

afterEach(() => sqlite.close());

describe('DrizzleClientRepository.search', () => {
  it('paginates and filters at DB level', async () => {
    const repo = new DrizzleClientRepository();
    await repo.save({ firstName: 'John', lastName: 'Doe' });
    await repo.save({ firstName: 'Jane', lastName: 'Doe' });
    await repo.save({ firstName: 'Other', lastName: 'Smith' });

    const result = await repo.search({ query: 'doe', page: 1, size: 10, sortBy: 'lastName', sortDir: 'asc' });
    expect(result.items).toHaveLength(2);
    expect(result.total).toBe(2);
  });
});
```

### 16.5 Integration Test Example

```typescript
// tests/integration/create-client.integration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { initDatabase, closeDatabase } from '@/backend/config/db';
import { container } from '@/backend/di/container';
import { ClientAlreadyExistsError } from '@/backend/modules/(core-domain)/clients/domain/exceptions';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';

beforeEach(() => {
  const tmp = path.join(os.tmpdir(), `cmd-test-${Date.now()}.db`);
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  initDatabase(tmp);
});

afterEach(() => closeDatabase());

describe('CreateClientService integration', () => {
  it('creates a client and rejects duplicates', async () => {
    const created = await container.createClientService.execute({
      firstName: 'John', lastName: 'Doe', email: 'john@x.com',
    });
    expect(created.email).toBe('john@x.com');

    await expect(
      container.createClientService.execute({ firstName: 'Jane', lastName: 'Doe', email: 'john@x.com' })
    ).rejects.toBeInstanceOf(ClientAlreadyExistsError);
  });
});
```

### 16.6 E2E Test Example

```typescript
// tests/e2e/clients.e2e.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Client CRUD', () => {
  test('create, update, delete a client', async ({ page }) => {
    await page.goto('http://localhost:1420'); // Tauri dev URL
    await page.click('text=Clients');
    await page.click('text=New Client');
    await page.fill('[name=firstName]', 'Ada');
    await page.fill('[name=lastName]', 'Lovelace');
    await page.fill('[name=email]', 'ada@analytical.engine');
    await page.click('text=Save');
    await expect(page.locator('text=Ada Lovelace')).toBeVisible();

    await page.click('text=Ada Lovelace');
    await page.click('text=Edit');
    await page.fill('[name=firstName]', 'Ada Augusta');
    await page.click('text=Save');
    await expect(page.locator('text=Ada Augusta Lovelace')).toBeVisible();

    await page.click('text=Delete');
    await page.click('text=Confirm');
    await expect(page.locator('text=Ada Augusta Lovelace')).toHaveCount(0);
  });

  test('backup and restore round-trip', async ({ page }) => {
    await page.goto('http://localhost:1420');
    await page.click('text=Settings');
    await page.click('text=Create Backup');
    await expect(page.locator('text=Backup created')).toBeVisible();
    await page.click('text=Restore');
    await expect(page.locator('text=Restore complete')).toBeVisible();
  });
});
```

### 16.7 Coverage Goals

| Layer | Target |
|---|---|
| Domain rules (unit) | ≥ 95% |
| Services (unit + integration) | ≥ 85% |
| Repositories (integration) | ≥ 80% |
| E2E critical workflows | All business-critical paths |

---

## PART 17 — State Management Architecture

### 17.1 Three Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│  UI STATE  (src/frontend/store/ui-store.ts)                  │
│  ─────────────────────────────────────────────────────────── │
│  • themeMode (light/dark) — persisted to localStorage        │
│  • Drawer open/closed                                         │
│  • Global notifications / toasts                              │
│  • Global loading overlay                                     │
│  • Confirm dialog state                                       │
│  Owned by: app shell  │  Lifetime: entire session             │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  FEATURE STATE  (src/frontend/modules/<mod>/feature-*/       │
│                 application/<name>-store.ts)                  │
│  ─────────────────────────────────────────────────────────── │
│  • Selected client id                                         │
│  • Current filters (query, page, sort)                        │
│  • Form draft state + validation errors                       │
│  • cachedItems (server result — explicitly named)             │
│  Owned by: feature module  │  Lifetime: feature is mounted   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│  SERVER / DATA STATE  (SQLite via service invoker)            │
│  ─────────────────────────────────────────────────────────── │
│  • Client list (paginated result)                             │
│  • Single client record                                       │
│  • Search results                                             │
│  Source of truth: SQLite  │  Re-fetched when stale            │
└──────────────────────────────────────────────────────────────┘
```

### 17.2 UI Store

```typescript
// src/frontend/store/ui-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  severity: 'success' | 'info' | 'warning' | 'error';
  message: string;
}

interface ConfirmState {
  open: boolean; title: string; message: string;
  onConfirm?: () => void; onCancel?: () => void;
}

interface UiState {
  themeMode: 'light' | 'dark';
  drawerOpen: boolean;
  globalLoading: boolean;
  notifications: Notification[];
  confirm: ConfirmState;

  toggleTheme: () => void;
  setDrawerOpen: (open: boolean) => void;
  setGlobalLoading: (loading: boolean) => void;
  pushNotification: (n: Omit<Notification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  openConfirm: (state: Omit<ConfirmState, 'open'>) => void;
  closeConfirm: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themeMode: 'light',
      drawerOpen: false,
      globalLoading: false,
      notifications: [],
      confirm: { open: false, title: '', message: '' },

      toggleTheme: () => set((s) => ({ themeMode: s.themeMode === 'light' ? 'dark' : 'light' })),
      setDrawerOpen: (open) => set({ drawerOpen: open }),
      setGlobalLoading: (loading) => set({ globalLoading: loading }),
      pushNotification: (n) =>
        set((s) => ({ notifications: [...s.notifications, { ...n, id: crypto.randomUUID() }] })),
      dismissNotification: (id) =>
        set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),
      openConfirm:  (state) => set({ confirm: { ...state, open: true } }),
      closeConfirm: () => set({ confirm: { open: false, title: '', message: '' } }),
    }),
    { name: 'ui-preferences', partialize: (s) => ({ themeMode: s.themeMode }) }
  )
);
```

### 17.3 Feature Store

```typescript
// src/frontend/modules/(dashboard)/clients/feature-client-list/application/client-list-store.ts
import { create } from 'zustand';
import type { ClientFilters } from '@/backend/modules/(core-domain)/clients/dto/client-filters.dto';
import type { PaginatedResult } from '@/backend/core/pagination';
import type { Client } from '@/backend/modules/(core-domain)/clients/domain/entities';

interface ClientListState {
  // Feature-owned UI state
  filters: ClientFilters;
  selectedClientId: string | null;
  listDrawerOpen: boolean;
  // Cached server result — re-fetched when filters change
  cachedItems: PaginatedResult<Client> | null;
  isFetching: boolean;
  lastError: string | null;

  setFilters: (patch: Partial<ClientFilters>) => void;
  setSelectedClient: (id: string | null) => void;
  setListDrawerOpen: (open: boolean) => void;
  setCachedItems: (items: PaginatedResult<Client> | null) => void;
  setFetching: (v: boolean) => void;
  setError: (e: string | null) => void;
}

export const useClientListStore = create<ClientListState>((set) => ({
  filters: { page: 1, size: 20, sortBy: 'lastName', sortDir: 'asc' },
  selectedClientId: null,
  listDrawerOpen: false,
  cachedItems: null,
  isFetching: false,
  lastError: null,

  setFilters: (patch) => set((s) => ({ filters: { ...s.filters, ...patch } })),
  setSelectedClient: (id) => set({ selectedClientId: id }),
  setListDrawerOpen: (open) => set({ listDrawerOpen: open }),
  setCachedItems: (items) => set({ cachedItems: items }),
  setFetching: (v) => set({ isFetching: v }),
  setError: (e) => set({ lastError: e }),
}));
```

### 17.4 Feature Hook (Server State Synchronisation)

```typescript
// src/frontend/modules/(dashboard)/clients/feature-client-list/application/use-load-clients.ts
import { useEffect } from 'react';
import { clientContract } from '@/backend/modules/(core-domain)/clients/contracts/client.contract';
import { useClientListStore } from './client-list-store';

export function useLoadClients() {
  const { filters, setCachedItems, setFetching, setError, cachedItems, isFetching, lastError } =
    useClientListStore();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFetching(true);
      setError(null);
      try {
        const result = await clientContract.search(filters);
        if (!cancelled) setCachedItems(result);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setFetching(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filters, setCachedItems, setFetching, setError]);

  return { items: cachedItems, isFetching, lastError };
}
```

### 17.5 Boundary Rules

| Rule | Enforcement |
|---|---|
| UI store imports nothing from features | Folder boundary: `frontend/store/` allows only `frontend/shared/` |
| Feature stores do not import each other | `no-restricted-imports` per feature folder |
| Server data never lives in UI store | UI store has no `clients: Client[]` field |
| Feature stores hold only `cachedItems`, not source-of-truth | Explicitly named `cachedItems` and re-fetched on filter change |
| Form draft state is feature-local, not global | Lives inside `feature-client-form` only |

---

## PART 18 — MUI Theme Setup

### 18.1 Theme File

```typescript
// src/frontend/core/theme.ts
import { createTheme, type Theme } from '@mui/material/styles';

const typography = {
  fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  h1: { fontSize: '1.75rem', fontWeight: 700 },
  h2: { fontSize: '1.5rem',  fontWeight: 600 },
  h3: { fontSize: '1.25rem', fontWeight: 600 },
  body1: { fontSize: '0.9375rem' },
  body2: { fontSize: '0.875rem' },
};

const shape = { borderRadius: 8 };

export const lightTheme: Theme = createTheme({
  typography,
  shape,
  palette: {
    mode: 'light',
    primary:    { main: '#2563EB', contrastText: '#fff' },
    secondary:  { main: '#7C3AED' },
    background: { default: '#F8FAFC', paper: '#FFFFFF' },
    text:       { primary: '#0F172A', secondary: '#475569' },
    divider:    '#E2E8F0',
  },
});

export const darkTheme: Theme = createTheme({
  typography,
  shape,
  palette: {
    mode: 'dark',
    primary:    { main: '#3B82F6', contrastText: '#fff' },
    secondary:  { main: '#8B5CF6' },
    background: { default: '#0F172A', paper: '#1E293B' },
    text:       { primary: '#F1F5F9', secondary: '#94A3B8' },
    divider:    '#334155',
  },
});
```

### 18.2 Root Layout — ThemeProvider + Bootstrap

```tsx
// src/app/layout.tsx
'use client';
import { ReactNode, useEffect, useState } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { lightTheme, darkTheme } from '@/frontend/core/theme';
import { useUiStore } from '@/frontend/store/ui-store';
import { initApp } from '@/bootstrap/app-init';
import { invoke } from '@/backend/shared/tauri/ipc-client';
import '@/frontend/styles/globals.css';

export default function RootLayout({ children }: { children: ReactNode }) {
  const themeMode = useUiStore((s) => s.themeMode);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    invoke<string>('get_db_path')
      .then((dbPath) => initApp(dbPath))
      .then(() => setReady(true))
      .catch((err) => setError(String(err)));
  }, []);

  const theme = themeMode === 'dark' ? darkTheme : lightTheme;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {error
            ? <StartupError message={error} />
            : ready
              ? children
              : <BootSplash />}
        </ThemeProvider>
      </body>
    </html>
  );
}

function BootSplash() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      Starting up…
    </div>
  );
}

function StartupError({ message }: { message: string }) {
  return (
    <div style={{ padding: 32, color: 'red' }}>
      <h2>Application failed to start</h2>
      <pre>{message}</pre>
      <p>Restore a compatible backup, then restart the application.</p>
    </div>
  );
}
```

### 18.3 Dark Mode Toggle Component

```tsx
// src/frontend/shared/ui/ThemeToggle.tsx
'use client';
import { IconButton, Tooltip } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useUiStore } from '@/frontend/store/ui-store';

export function ThemeToggle() {
  const { themeMode, toggleTheme } = useUiStore();
  return (
    <Tooltip title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
      <IconButton onClick={toggleTheme} color="inherit">
        {themeMode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
}
```

### 18.4 Theme Persisted Across Sessions

The `ui-store` uses `zustand/middleware/persist` (see Part 17.2). The `themeMode` field is stored in `localStorage` (which Tauri's webview supports), so the user's preference survives restarts.

---

## PART 19 — Layouts

### 19.1 Shared Dashboard Shell

Placed in `src/frontend/shared/layouts/` because it is used by every dashboard page.

```tsx
// src/frontend/shared/layouts/dashboard-shell/DashboardShell.tsx
'use client';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItemButton, ListItemText } from '@mui/material';
import { useUiStore } from '@/frontend/store/ui-store';
import { ThemeToggle } from '@/frontend/shared/ui/ThemeToggle';
import { useRouter, usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const DRAWER_WIDTH = 240;
const NAV = [
  { label: 'Clients',  path: '/clients' },
  { label: 'Settings', path: '/settings' },
];

export function DashboardShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Top bar */}
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>Client Manager</Typography>
          <ThemeToggle />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH, flexShrink: 0,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
      }}>
        <Toolbar /> {/* Spacer to push content below AppBar */}
        <List>
          {NAV.map(({ label, path }) => (
            <ListItemButton
              key={path}
              selected={pathname === path}
              onClick={() => router.push(path)}
            >
              <ListItemText primary={label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}
```

```typescript
// src/frontend/shared/layouts/dashboard-shell/index.ts
export { DashboardShell } from './DashboardShell';
```

### 19.2 Module-Specific Layout

Placed in `src/frontend/modules/(dashboard)/clients/layouts/` because it is Clients-specific.

```tsx
// src/frontend/modules/(dashboard)/clients/layouts/ClientsLayout.tsx
import { Box, Typography } from '@mui/material';
import type { ReactNode } from 'react';

/**
 * Clients module layout — adds the section heading and
 * any module-wide toolbar (action buttons, filter bar, etc.).
 * Rendered INSIDE DashboardShell by the page.
 */
export function ClientsLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="h2">Clients</Typography>
      {children}
    </Box>
  );
}
```

### 19.3 Page Wiring

```tsx
// src/app/(dashboard)/clients/page.tsx
import { DashboardShell } from '@/frontend/shared/layouts/dashboard-shell';
import { ClientsLayout } from '@/frontend/modules/(dashboard)/clients/layouts/ClientsLayout';
import { ClientListSection } from '@/frontend/modules/(dashboard)/clients/feature-client-list/sections/ClientListSection';

export default function ClientsPage() {
  return (
    <DashboardShell>
      <ClientsLayout>
        <ClientListSection />
      </ClientsLayout>
    </DashboardShell>
  );
}
```

---

## PART 20 — Build & Distribution

### 20.1 package.json Scripts

```json
{
  "scripts": {
    "dev":          "next dev",
    "build":        "next build",
    "tauri:dev":    "tauri dev",
    "tauri:build":  "tauri build",
    "db:generate":  "drizzle-kit generate",
    "db:migrate":   "tsx src/bootstrap/migration-runner.ts",
    "db:studio":    "drizzle-kit studio",
    "test":         "vitest run",
    "test:watch":   "vitest",
    "test:e2e":     "playwright test"
  }
}
```

### 20.2 Production Build Order

```
1. npm run db:generate       # Only if schema.ts changed since last build
2. npm run build             # Next.js static export → ./out/
3. npm run tauri:build       # Rust compile + embed ./out → installer
4. Artifacts: src-tauri/target/release/bundle/{msi,nsis}/
```

### 20.3 CI Workflow

```yaml
name: release
on: { push: { tags: ['v*'] } }
jobs:
  windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: dtolnay/rust-toolchain@stable
      - run: npm ci
      - run: npm run db:generate
      - run: npm run build
      - run: npm run tauri:build
      - uses: actions/upload-artifact@v4
        with:
          name: windows-installer
          path: src-tauri/target/release/bundle/**/*.msi
```

---

## PART 21 — Migration Roadmap (Old → New)

### 21.1 src/ Folder Reorganisation (if migrating from previous version)

| Step | Action | Risk |
|---|---|---|
| 1 | Create `backend/`, `frontend/` inside `src/` | Low |
| 2 | Move `src/server/**` → `src/backend/**` | Medium — update all `@/server/` imports |
| 3 | Move `src/api/base/service-invoker.ts` → `src/backend/core/service-invoker.ts` | Medium |
| 4 | Move `src/api/tauri/ipc-client.ts` → `src/backend/shared/tauri/ipc-client.ts` | Low |
| 5 | Move `src/api/contracts/*.contract.ts` into each module's `contracts/` folder | Low |
| 6 | Move `src/modules/**` → `src/frontend/modules/**` | Medium — update all `@/modules/` imports |
| 7 | Move `src/store/**` → `src/frontend/store/**` | Low |
| 8 | Move `src/shared/**` → `src/frontend/shared/**` | Low |
| 9 | Move `src/layouts/**` → `src/frontend/shared/layouts/**` | Low |
| 10 | Move `src/core/**` → `src/frontend/core/**` | Low |
| 11 | Move `src/styles/**` → `src/frontend/styles/**` | Low |
| 12 | Update `drizzle.config.ts` schema path | Low |
| 13 | Update `vitest.config.ts` test include patterns | Low |
| 14 | Update all ESLint rules to reference new paths | Low |
| 15 | Run `npm run test` green | Required gate |

### 21.2 Feature Migration (Prisma → Drizzle)

| Step | Action | Risk |
|---|---|---|
| 1 | Add Drizzle alongside Prisma (parallel schemas) | Low |
| 2 | Reimplement repositories one-by-one using Drizzle | Low (interface unchanged) |
| 3 | Add bootstrap migration runner; remove Prisma migrate scripts | Medium |
| 4 | Delete `src/app/api/**` and fetch wrapper; switch to `invokeService` | Medium |
| 5 | Add Tauri Rust backup commands; delete old file-copy logic | Medium |
| 6 | Replace in-memory `filterClientsByQuery` with `repo.search(filters)` | Low |
| 7 | Add `schema_meta` table + version-guard bootstrap | Medium |
| 8 | Add Rust `tracing` init + frontend category logger | Low |
| 9 | Split Zustand: UI bits → `ui-store.ts`, feature bits → per-feature stores | Medium |
| 10 | Remove Prisma from `package.json` | Low |
| 11 | Run all four test layers green | Required gate |

---

## Final Architecture Summary

```
src/
├── app/          Next.js routing shell ONLY — no business logic
├── bootstrap/    Startup: init DB → run migrations → check schema version
├── backend/      DDD: modules, services, repositories, domain, contracts
│                     core, config, di, shared/tauri
└── frontend/     React UI: modules, store, shared (layouts + ui + hooks),
                            core (theme), styles

Runtime stack:
  Next.js (static export, zero server)
  + Tauri (Rust native shell, exposes commands via IPC)
  + Drizzle ORM (no query engine binary)
  + SQLite (single file in app_data_dir)
  + Repository Pattern (services depend on interfaces, enforced by ESLint)
  + Module Contracts (the ONLY backend–frontend seam)
  + MUI Theme (light + dark, persisted via Zustand + localStorage)
  + Structured Tracing (Rust tracing-subscriber + frontend category logger)
  + Migration Strategy (Drizzle SQL migrations + schema_meta version guard at startup)
  + Production-Ready Backup (VACUUM INTO + integrity check + pre-restore snapshot)
  + Four-Layer Tests (unit / repository / integration / e2e)
  + Three State Boundaries (UI / Feature / Server)
  + ESLint import boundary enforcement at every layer
```

**This architecture is fully compatible with a Tauri desktop application running without a Next.js server in production. No internal HTTP requests exist anywhere in the data path. Every layer is tested. Every import boundary is enforced by ESLint. The theme persists. Setup is a single `npm ci` + `cargo build`.**

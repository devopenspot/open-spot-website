// Vitest stub for the `server-only` package. The real `server-only` throws
// at import time when bundled for the client, which breaks tests that
// transitively pull in server modules (via `src/lib/repositories`,
// `src/lib/supabase/server`, `src/proxy.ts`, etc.). This no-op keeps
// the import graph loadable in `happy-dom`. See AGENTS.md §"Testing
// gotchas".
export {}

# CLAUDE.md

**Important:** Always prepend `cd ~/Development/Gretz/stashl.ink &&` to any bash command.

**Important:** After reading this file, read `CLAUDE-WORKING.md` for ongoing work context and session notes.

## Project

Stashl.ink - link management app. Bun monorepo:

- `apps/api/` - Hono REST API (port 3001), PostgreSQL/Drizzle
- `apps/web/` - TanStack Start, Tailwind v4, shadcn/ui
- `apps/mobile/` - React Native/Expo 53
- `apps/tasks/` - pg-boss background job runner
- `packages/domain/` - Business logic, Drizzle ORM
- `packages/iocdi/` - Custom functional DI container

## Commands

```bash
bun install              # Install deps
bun run dev              # API + web concurrently
bun run dev:api          # API only (port 3001)
bun run dev:web          # Web only
bun run dev:tasks        # Tasks background runner
bun run dev:mobile       # Mobile dev server
bun run type-check       # TypeScript check all packages
```

## Design Theme

"Woodsy papyrus" - gnome mascot with quill/tablet:

- Primary: Deep teal (#2b5f5f)
- Accent: Bright orange (#ff4500)
- Background: Cream (#f5f5dc)
- Text: Dark brown (#3d2914)
- Secondary: Warm tan (#d2b48c)

## Code Style

- Prettier: single quotes, semicolons, trailing commas
- ES modules only (import/export), destructure imports
- Functional > OO > procedural
- Prefer `function()` over `() =>`
- Small composable functions
- Comments only for "why", be terse

## Rules

- Do what's asked; nothing more, nothing less
- Be terse in explanations
- NEVER create files unless absolutely necessary
- ALWAYS prefer editing existing files
- NEVER create .md files unless explicitly requested
- Record working notes and learnings to `CLAUDE-WORKING.md`

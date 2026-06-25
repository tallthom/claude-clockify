# Security Fixes Design — claude-clockify

**Date:** 2026-06-25
**Scope:** Two high-priority security fixes identified in security review

---

## Fix 1: Enforce Zod schema validation on tool arguments

### Problem

`server/src/index.ts` passes raw MCP request arguments to tool handlers without ever calling the tool's Zod `inputSchema`. All validation constraints — objectId regex, HTML stripping on `description`, `.default()` transforms, format constraints — are defined but never applied at runtime. Unvalidated input reaches the Axios API layer directly.

### Design

In the `CallToolRequestSchema` handler in `server/src/index.ts`, after `applyDefaults` and `validateToolAccess`, call `tool.inputSchema.safeParse(processedArgs)`:

```ts
const parseResult = tool.inputSchema.safeParse(processedArgs);
if (!parseResult.success) {
  throw new McpError(
    ErrorCode.InvalidParams,
    `Invalid arguments: ${parseResult.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; ')}`
  );
}
const result = await tool.handler(parseResult.data);
```

- Use `.safeParse()` (not `.parse()`) to keep the validation path explicit and separate from the catch block.
- Pass `parseResult.data` — the Zod-transformed output — to the handler, so transforms (HTML stripping, defaults) take effect.
- The existing catch block is unchanged; it handles API-level errors only.

**Files changed:** `server/src/index.ts` only.

---

## Fix 2: Hard page cap on `getTimeEntriesInRange`

### Problem

`server/src/api/services/timeEntry.service.ts` — `getTimeEntriesInRange` loops indefinitely until the Clockify API returns fewer than `pageSize` entries. On a large account this can fire hundreds of sequential API requests from a single tool call. The `rateLimitPerMinute` config setting is parsed but explicitly unimplemented.

### Design

Add a module-level constant at the top of `timeEntry.service.ts`:

```ts
const MAX_PAGES = 10;
```

In `getTimeEntriesInRange`, add a break condition after incrementing `page`:

```ts
if (page > MAX_PAGES) break;
```

- 10 pages × 1,000 entries/page = 10,000 entries maximum per range query.
- The constant is named and placed at module scope for easy adjustment.
- No config changes, no new dependencies.

**Files changed:** `server/src/api/services/timeEntry.service.ts` only.

---

## Out of scope

- Implementing `rateLimitPerMinute` as a real token bucket — tracked separately in GitHub issue #24.
- Medium/Low severity findings from the security review — tracked in GitHub issues #19–#25.

---

## Testing

- **Fix 1:** Pass a tool argument with an invalid objectId (e.g. `"not-an-id"`) and confirm an `InvalidParams` MCP error is returned. Pass valid args and confirm the handler receives transformed data (e.g. HTML stripped from `description`).
- **Fix 2:** Unit test `getTimeEntriesInRange` with a mock that always returns a full page — confirm the loop terminates after `MAX_PAGES` iterations.
- Build: `npm run build` must pass with no type errors.

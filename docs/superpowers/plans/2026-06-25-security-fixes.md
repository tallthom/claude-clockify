# Security Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two high-priority security issues: enforce Zod schema validation on all tool inputs, and cap the pagination loop in `getTimeEntriesInRange` to prevent runaway API calls.

**Architecture:** Fix 1 is a single insertion in the `CallToolRequestSchema` handler in `index.ts` — `.safeParse()` replaces the raw passthrough to `tool.handler`. Fix 2 is a module-level constant and one `if` check in `timeEntry.service.ts`. Both fixes are independent and can be implemented in either order. Tests require adding `vitest` (no test framework currently exists).

**Tech Stack:** TypeScript 5.x, Node 18+, ESM modules, Zod 3.x, `@modelcontextprotocol/sdk`, vitest

## Global Constraints

- Work directly on `main` branch — no PRs
- All commits include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- `npm run build` (runs `tsc`) must pass clean after every task
- `noUnusedLocals` and `noUnusedParameters` are enabled — do not introduce unused variables
- ESM project (`"type": "module"`) — imports need `.js` extensions in compiled output; vitest handles this natively

---

## Files

| File | Change |
|------|--------|
| `server/package.json` | Add `vitest` to devDependencies, add `test` script |
| `server/vitest.config.ts` | New — vitest config for ESM + TypeScript |
| `server/src/index.ts` | Add `.safeParse()` call before `tool.handler(...)` |
| `server/src/api/services/timeEntry.service.ts` | Add `MAX_PAGES` constant and break condition |
| `server/src/tests/validation.test.ts` | New — tests for Fix 1 |
| `server/src/tests/timeEntryPagination.test.ts` | New — tests for Fix 2 |

---

## Task 1: Add vitest test framework

**Files:**
- Modify: `server/package.json`
- Create: `server/vitest.config.ts`

**Interfaces:**
- Produces: `npm test` command that runs `vitest run`

- [ ] **Step 1: Install vitest**

```bash
cd /Users/thomw/Claude/claude-clockify/server
npm install --save-dev vitest
```

Expected: vitest added to `node_modules` and `package-lock.json` updated.

- [ ] **Step 2: Add test script to package.json**

In `server/package.json`, add `"test": "vitest run"` to the `scripts` block:

```json
"scripts": {
  "build": "tsc",
  "start": "node dist/index.js",
  "dev": "tsx watch src/index.ts",
  "typecheck": "tsc --noEmit",
  "test": "vitest run"
},
```

- [ ] **Step 3: Create vitest config**

Create `server/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
  },
});
```

- [ ] **Step 4: Verify test runner works**

Create a temporary smoke test file `server/src/tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run:
```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test
```

Expected output includes: `1 passed`

- [ ] **Step 5: Delete smoke test**

```bash
rm /Users/thomw/Claude/claude-clockify/server/src/tests/smoke.test.ts
```

- [ ] **Step 6: Verify build still passes**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm run build
```

Expected: exits 0, no errors.

- [ ] **Step 7: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify/server
git add package.json package-lock.json ../server/vitest.config.ts
```

Wait — stage from repo root:

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/package.json server/package-lock.json server/vitest.config.ts
git commit -m "$(cat <<'EOF'
chore: add vitest test framework

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Fix page cap in getTimeEntriesInRange

**Files:**
- Modify: `server/src/api/services/timeEntry.service.ts`
- Create: `server/src/tests/timeEntryPagination.test.ts`

**Interfaces:**
- Consumes: `TimeEntryService.getTimeEntriesInRange(workspaceId, userId, start, end)` — returns `Promise<ClockifyTimeEntry[]>`
- Consumes: `TimeEntryService.getTimeEntriesForUser(...)` — called internally by `getTimeEntriesInRange`
- Produces: `getTimeEntriesInRange` that terminates after at most `MAX_PAGES` API calls

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/timeEntryPagination.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TimeEntryService } from '../api/services/timeEntry.service.js';
import type { ClockifyApiClient } from '../api/client.js';

function makeFullPage(pageSize = 1000) {
  return Array.from({ length: pageSize }, (_, i) => ({
    id: `entry-${i}`,
    description: '',
    userId: 'user1',
    workspaceId: 'ws1',
    projectId: null,
    taskId: null,
    tagIds: [],
    billable: false,
    isLocked: false,
    type: 'REGULAR' as const,
    timeInterval: { start: '2026-01-01T00:00:00Z', end: '2026-01-01T01:00:00Z', duration: 'PT1H' },
    hourlyRate: null,
    costRate: null,
    customFieldValues: [],
  }));
}

describe('getTimeEntriesInRange', () => {
  it('stops after MAX_PAGES even when every page is full', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue(makeFullPage()),
    } as unknown as ClockifyApiClient;

    const service = new TimeEntryService(mockClient);
    const result = await service.getTimeEntriesInRange('ws1', 'user1', '2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z');

    // MAX_PAGES = 10, each page has 1000 entries
    expect(result).toHaveLength(10000);
    expect(mockClient.get).toHaveBeenCalledTimes(10);
  });

  it('stops early when a page is not full', async () => {
    const mockClient = {
      get: vi.fn()
        .mockResolvedValueOnce(makeFullPage())
        .mockResolvedValueOnce(makeFullPage(500)),
    } as unknown as ClockifyApiClient;

    const service = new TimeEntryService(mockClient);
    const result = await service.getTimeEntriesInRange('ws1', 'user1', '2026-01-01T00:00:00Z', '2026-01-07T23:59:59Z');

    expect(result).toHaveLength(1500);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test
```

Expected: test for "stops after MAX_PAGES" fails — the loop runs indefinitely (or times out) because no cap exists yet.

- [ ] **Step 3: Add MAX_PAGES constant and break condition**

In `server/src/api/services/timeEntry.service.ts`, add the constant immediately after the imports:

```ts
const MAX_PAGES = 10;
```

In `getTimeEntriesInRange`, change the loop from:

```ts
while (true) {
  const batch = await this.getTimeEntriesForUser(workspaceId, userId, {
    start,
    end,
    'page-size': pageSize,
    page,
  });
  all.push(...batch);
  if (batch.length < pageSize) break;
  page++;
}
```

To:

```ts
while (true) {
  const batch = await this.getTimeEntriesForUser(workspaceId, userId, {
    start,
    end,
    'page-size': pageSize,
    page,
  });
  all.push(...batch);
  if (batch.length < pageSize) break;
  if (page >= MAX_PAGES) break;
  page++;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test
```

Expected: both pagination tests pass.

- [ ] **Step 5: Verify build passes**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm run build
```

Expected: exits 0, no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/src/api/services/timeEntry.service.ts server/src/tests/timeEntryPagination.test.ts
git commit -m "$(cat <<'EOF'
fix: cap getTimeEntriesInRange at MAX_PAGES to prevent runaway API calls

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Enforce Zod schema validation on tool arguments

**Files:**
- Modify: `server/src/index.ts` (lines 63–70)
- Create: `server/src/tests/validation.test.ts`

**Interfaces:**
- Consumes: `tool.inputSchema` — a `ZodSchema` object on each tool definition
- Consumes: `McpError`, `ErrorCode` — already imported in `index.ts`
- Produces: All tool handlers receive Zod-transformed `parseResult.data` instead of raw args

- [ ] **Step 1: Write the failing tests**

Create `server/src/tests/validation.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { objectIdSchema } from '../tools/schemas.js';

// Directly test the schema behaviour that the handler will now enforce

describe('objectIdSchema', () => {
  it('rejects non-hex strings', () => {
    const result = objectIdSchema.safeParse('not-an-id');
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/24-character hex/);
    }
  });

  it('accepts a valid 24-char hex objectId', () => {
    const result = objectIdSchema.safeParse('507f1f77bcf86cd799439011');
    expect(result.success).toBe(true);
  });
});

describe('createTimeEntrySchema description transform', () => {
  const schema = z.object({
    workspaceId: objectIdSchema,
    description: z
      .string()
      .transform(desc => desc.replace(/<[^>]*>/g, '').trim()),
    start: z.string(),
  });

  it('strips HTML tags from description', () => {
    const result = schema.safeParse({
      workspaceId: '507f1f77bcf86cd799439011',
      description: '<b>Hello</b> <script>alert(1)</script>world',
      start: '2026-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBe('Hello world');
    }
  });
});
```

- [ ] **Step 2: Run tests to confirm they pass (these test schemas directly)**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test
```

Expected: all validation tests pass — the schemas work correctly in isolation. This confirms what the handler *should* be enforcing.

- [ ] **Step 3: Apply the fix in index.ts**

In `server/src/index.ts`, replace lines 63–70:

**Before:**
```ts
try {
  const args = request.params.arguments || {};

  // Apply middleware restrictions and defaults (async — resolves workspace ID if needed)
  const processedArgs = await restrictionMiddleware.applyDefaults(args);
  restrictionMiddleware.validateToolAccess(request.params.name, processedArgs);

  const result = await tool.handler(processedArgs);
```

**After:**
```ts
try {
  const args = request.params.arguments || {};

  // Apply middleware restrictions and defaults (async — resolves workspace ID if needed)
  const processedArgs = await restrictionMiddleware.applyDefaults(args);
  restrictionMiddleware.validateToolAccess(request.params.name, processedArgs);

  const parseResult = tool.inputSchema.safeParse(processedArgs);
  if (!parseResult.success) {
    throw new McpError(
      ErrorCode.InvalidParams,
      `Invalid arguments: ${parseResult.error.issues.map((i: { path: (string | number)[]; message: string }) => `${i.path.join('.')}: ${i.message}`).join('; ')}`
    );
  }

  const result = await tool.handler(parseResult.data);
```

- [ ] **Step 4: Verify build passes**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm run build
```

Expected: exits 0, no type errors. Note: if `noUnusedLocals` fires on the type annotation in the map callback, use `i: { path: PropertyKey[]; message: string }` or cast via `parseResult.error.issues.map((i: import('zod').ZodIssue) => ...)`.

- [ ] **Step 5: Run all tests**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/src/index.ts server/src/tests/validation.test.ts
git commit -m "$(cat <<'EOF'
fix: enforce Zod schema validation on all tool arguments at runtime

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Final verification and GitHub issues

**Files:** None

- [ ] **Step 1: Run full build and test suite**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm run build && npm test
```

Expected: clean build, all tests pass.

- [ ] **Step 2: Close the two GitHub issues**

These two issues were created during the security review for the High priority findings. Close them now that the fixes are merged:

The issues to close are the two high-priority ones — check with:
```bash
cd /Users/thomw/Claude/claude-clockify && gh issue list --repo tallthom/claude-clockify
```

Close the Zod validation issue and the pagination issue with:
```bash
gh issue close <NUMBER> --repo tallthom/claude-clockify --comment "Fixed in commits on main."
```

- [ ] **Step 3: Update session log**

Log the completed security fixes in `~/Claude/memory/session-log.md`.

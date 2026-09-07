# Surface Forbidden/403 Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When Clockify's API returns a 403 (`Forbidden: ...`), stop swallowing it into the generic "Tool execution failed. Check server logs for details." message and surface the real cause instead, so a user hitting a plan/permission restriction (as opposed to an actual server bug) can tell the difference without needing server log access.

**Architecture:** Extract the error-to-`McpError` mapping that currently lives inline in `server/src/index.ts`'s `CallToolRequestSchema` handler into a small, pure, unit-testable function (`mapClockifyError`). Add one new branch to that mapping for `Forbidden`/`403` messages. Wire `index.ts` to call the extracted function instead of duplicating the logic inline.

**Spec:** No separate spec doc, this plan is scoped directly from the diagnosis in this conversation. Reproduction: a live `list_tasks` call against workspace `65b873dabd0f46264481b15e` returns Clockify's raw `{"message":"Access Denied","code":501}` with HTTP 403 (confirmed via direct `curl` with the same API key, and independently via `get_project` succeeding with 200 on the same workspace, isolating the failure to the tasks endpoint specifically, not auth/connectivity). `client.ts`'s response interceptor already converts that into `Error("Forbidden: You don't have permission to perform this action")`, but `index.ts`'s catch-all only recognises `"Invalid API key"`, `"unauthorized"`, `"Rate limit"`, `"429"`, `"not found"`, `"404"`, `"restricted"`, `"not allowed"`, none of which match `"Forbidden"`, so the error falls through to the generic `InternalError` branch.

**Tech Stack:** TypeScript 5.x, Node 18+, ESM modules (`.js` import extensions required), `@modelcontextprotocol/sdk`, vitest

## Global Constraints

- Work directly on `main` branch, no PR (own project: `tallthom/claude-clockify`)
- All commits include `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`
- `npm run build` (runs `tsc`) must pass clean after every task
- ESM project (`"type": "module"`), relative imports need `.js` extensions
- Do not change the behaviour of any existing branch (`Invalid API key`, `Rate limit`, `not found`, `restricted`/`not allowed`, MCP-error passthrough, generic fallback), only add the new `Forbidden`/`403` branch
- This is a single-purpose patch release (bug fix only, no new features), version bump is **PATCH**, per `memory/coding.md`'s semver rule

---

## Files

| File | Change |
|------|--------|
| `server/src/errors/mapClockifyError.ts` | New, pure function extracted from `index.ts`'s catch block, plus new `Forbidden`/`403` branch |
| `server/src/tests/mapClockifyError.test.ts` | New, covers every branch, including the new one |
| `server/src/index.ts` | Replace inline catch-block logic with a call to `mapClockifyError` |
| `server/package.json`, `manifest.json`, `server/src/index.ts` (server `version` field) | Bump `1.2.2` → `1.2.3` (release step, not part of the TDD tasks below) |

---

## Task 1: Extract and fix the error mapping

**Files:**
- Create: `server/src/errors/mapClockifyError.ts`
- Test: `server/src/tests/mapClockifyError.test.ts`
- Modify: `server/src/index.ts:87-112`

**Interfaces:**
- Produces: `mapClockifyError(error: unknown): McpError`, takes whatever `tool.handler(...)` threw (an existing `McpError`-shaped object, or a plain `Error` from `client.ts`/`restrictions.ts`) and returns an `McpError` ready to `throw`. Never throws itself.

- [ ] **Step 1: Write the failing tests**

Create `server/src/tests/mapClockifyError.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { mapClockifyError } from '../errors/mapClockifyError.js';

describe('mapClockifyError', () => {
  it('passes an existing McpError-shaped object through unchanged', () => {
    const mcpError = { code: ErrorCode.InvalidParams, message: 'Invalid arguments: projectId: Required' };

    const result = mapClockifyError(mcpError);

    expect(result).toBe(mcpError);
  });

  it('maps an invalid API key error to InvalidRequest with a config-pointing message', () => {
    const result = mapClockifyError(new Error('Invalid API key or unauthorized access'));

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain('CLOCKIFY_API_KEY');
  });

  it('maps a rate limit error to InvalidRequest with a retry message', () => {
    const result = mapClockifyError(new Error('Rate limit exceeded. Please try again later'));

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain('rate limit');
  });

  it('maps a not-found error to InvalidRequest, preserving the original message', () => {
    const result = mapClockifyError(new Error('Resource not found'));

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain('Resource not found');
  });

  it('maps a restriction-middleware error to InvalidRequest, preserving the original message', () => {
    const result = mapClockifyError(new Error('Access to project abc123 is restricted'));

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toBe('Access to project abc123 is restricted');
  });

  it('maps a Forbidden/403 error to InvalidRequest with a plan/permission explanation, not the generic fallback', () => {
    const result = mapClockifyError(
      new Error("Forbidden: You don't have permission to perform this action")
    );

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain("Forbidden: You don't have permission to perform this action");
    expect(result.message).toContain('plan');
    expect(result.message).not.toContain('Tool execution failed');
  });

  it('falls back to a generic InternalError for anything unrecognised, without leaking the raw message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = mapClockifyError(new Error('ECONNRESET: socket hang up'));

    expect(result.code).toBe(ErrorCode.InternalError);
    expect(result.message).toBe('Tool execution failed. Check server logs for details.');
    expect(spy).toHaveBeenCalledWith('Unexpected error:', 'ECONNRESET: socket hang up');

    spy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd server && npx vitest run src/tests/mapClockifyError.test.ts`
Expected: FAIL, `Cannot find module '../errors/mapClockifyError.js'`

- [ ] **Step 3: Write the implementation**

Create `server/src/errors/mapClockifyError.ts`:

```ts
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Maps an error thrown from a tool handler to an McpError safe to throw
 * back to the client. Existing McpError-shaped objects pass through as-is
 * (duck-typed, not instanceof, to survive module dedup issues inside .mcpb
 * bundles where the SDK may load twice).
 */
export function mapClockifyError(error: unknown): McpError {
  const err = error as { code?: unknown; message?: unknown };

  if (err?.code !== undefined && err?.message !== undefined && typeof err.code === 'number') {
    return error as McpError;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Invalid API key') || message.includes('unauthorized')) {
    return new McpError(
      ErrorCode.InvalidRequest,
      'Invalid Clockify API key. Please check your CLOCKIFY_API_KEY environment variable.'
    );
  } else if (message.includes('Rate limit') || message.includes('429')) {
    return new McpError(
      ErrorCode.InvalidRequest,
      'Clockify API rate limit exceeded. Please try again later.'
    );
  } else if (message.includes('not found') || message.includes('404')) {
    return new McpError(ErrorCode.InvalidRequest, `Resource not found: ${message}`);
  } else if (message.includes('restricted') || message.includes('not allowed')) {
    return new McpError(ErrorCode.InvalidRequest, message);
  } else if (message.includes('Forbidden') || message.includes('403')) {
    return new McpError(
      ErrorCode.InvalidRequest,
      `${message}. This usually means the resource isn't available on your Clockify plan, or your API key's role lacks permission for it, not an issue with the MCP server itself.`
    );
  } else {
    console.error('Unexpected error:', message);
    return new McpError(ErrorCode.InternalError, 'Tool execution failed. Check server logs for details.');
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd server && npx vitest run src/tests/mapClockifyError.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Wire index.ts to use the extracted function**

In `server/src/index.ts`, remove the `catch (error: any) { ... }` block's body (lines 87-112) and replace it with a call to the new function. Add the import alongside the other local imports at the top of the file:

```ts
import { ClockifyTools } from './tools/index.js';
import { ConfigurationManager } from './config/index.js';
import { mapClockifyError } from './errors/mapClockifyError.js';
```

Replace:

```ts
  } catch (error: any) {
    // Re-throw MCP errors as-is, use duck-typing rather than instanceof to survive
    // module deduplication issues inside .mcpb bundles where SDK may load twice
    if (error?.code !== undefined && error?.message !== undefined && typeof error.code === 'number') {
      throw error;
    }

    if (error.message.includes('Invalid API key') || error.message.includes('unauthorized')) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Invalid Clockify API key. Please check your CLOCKIFY_API_KEY environment variable.'
      );
    } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Clockify API rate limit exceeded. Please try again later.'
      );
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${error.message}`);
    } else if (error.message.includes('restricted') || error.message.includes('not allowed')) {
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    } else {
      console.error('Unexpected error:', error instanceof Error ? error.message : String(error));
      throw new McpError(ErrorCode.InternalError, 'Tool execution failed. Check server logs for details.');
    }
  }
```

with:

```ts
  } catch (error) {
    throw mapClockifyError(error);
  }
```

Note: `ErrorCode` is still used elsewhere in `index.ts` (the `MethodNotFound` throw above), so leave that import as-is, only the usages inside this one catch block move out.

- [ ] **Step 6: Run the full test suite and build**

Run: `cd server && npm test && npm run build`
Expected: All tests pass (including the 7 new ones), `tsc` completes with no errors.

- [ ] **Step 7: Commit**

```bash
git add server/src/errors/mapClockifyError.ts server/src/tests/mapClockifyError.test.ts server/src/index.ts
git commit -m "$(cat <<'EOF'
fix: surface Forbidden/403 Clockify errors instead of the generic catch-all

A workspace-level 403 (e.g. Tasks not available on the account's Clockify
plan) was falling through every recognised error branch and returning
"Tool execution failed. Check server logs for details.", indistinguishable
from an actual server bug. Extracted the error mapping into a testable
pure function and added a branch that explains the likely cause instead.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Release 1.2.3

This follows `memory/coding.md`'s release process exactly. Do not skip the live-test confirmation step, it's a hard stop, not a formality.

**Files:**
- Modify: `server/package.json` (`version`)
- Modify: `manifest.json` (`version`)
- Modify: `server/src/index.ts` (`version: '1.2.2'` → `'1.2.3'`, in the `Server` constructor)

- [ ] **Step 1: Run `/security-review` and `/code-review` on the local diff**

These are Claude Code slash commands, run them against the diff produced by Task 1 before touching version numbers.

- [ ] **Step 2: Bump the version in all three places**

In `server/package.json`, change:
```json
  "version": "1.2.2",
```
to:
```json
  "version": "1.2.3",
```

In `manifest.json`, change:
```json
  "version": "1.2.2",
```
to:
```json
  "version": "1.2.3",
```

In `server/src/index.ts`, change:
```ts
    version: '1.2.2',
```
to:
```ts
    version: '1.2.3',
```

- [ ] **Step 3: Rebuild the `.mcpb` bundle locally**

Run whatever this repo's existing packaging command is (check `package.json` scripts, e.g. `npm run build:mcpb` or similar, do not invent a new packaging step).

- [ ] **Step 4: Install and test locally in every relevant app**

- Claude Code CLI: points at `server/dist/index.js` directly via `~/Claude/.mcp.json`, no reinstall needed, just restart the session so the rebuilt server loads.
- Claude Desktop/Cowork: install the freshly built local `.mcpb` file directly.

Minimum verification in both:
- `list_tasks` against a workspace/project known to return the 403 (e.g. this session's repro: workspace `65b873dabd0f46264481b15e`, project `698ae2762401ad93add06204`) now returns a clear "Forbidden... this usually means..." message instead of "Tool execution failed."
- An unrelated existing tool call (e.g. `get_today_entries`) still succeeds, confirms the refactor didn't break the happy path.
- An invalid argument (e.g. `list_tasks` with no `projectId`) still returns the existing `-32602` validation error unchanged, confirms `InvalidParams` handling upstream of this catch block wasn't touched.

**Stop here and wait for Thom's explicit confirmation that all three checks passed before proceeding.**

- [ ] **Step 5: Commit the version bump, push, tag, and release**

Only after confirmation:

```bash
git add server/package.json manifest.json server/src/index.ts
git commit -m "$(cat <<'EOF'
chore: bump version to 1.2.3

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
git push
git tag v1.2.3
git push --tags
gh release create v1.2.3 --title "v1.2.3" --notes "Fix: 403 Forbidden errors from Clockify (e.g. when a workspace's plan doesn't include the Tasks feature) were being reported as a generic, unhelpful 'Tool execution failed' error. They now surface the real cause."
```

- [ ] **Step 6: Log the release in `memory/session-log.md`**

Add an entry noting the reported symptom, the confirmed root cause (Clockify-side 403 on the tasks endpoint, workspace/plan-level not project-specific), and the fix shipped in 1.2.3.

---

## Self-Review

**Spec coverage:** The only requirement is "stop swallowing 403s into the generic message", Task 1 implements and tests exactly that, Task 2 covers the mandatory release process from `coding.md`. No gaps.

**Placeholder scan:** No TBD/TODO; all steps have literal code or exact commands.

**Type consistency:** `mapClockifyError(error: unknown): McpError` is defined once in Task 1 Step 3 and consumed once in Task 1 Step 5 with matching signature. No other task references it.

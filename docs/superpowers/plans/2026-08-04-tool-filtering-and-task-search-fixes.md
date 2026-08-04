# Tool Filtering and Task Search Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix two confirmed bugs: the `maxTools` default silently drops 4 of 54 registered tools ([#27](https://github.com/tallthom/claude-clockify/issues/27)), and `list_tasks` can't filter by name even though the underlying service already supports it, forcing full-project dumps that blow the tool output limit ([#28](https://github.com/tallthom/claude-clockify/issues/28)).

**Architecture:** Issue #27 gets two changes: raise the default `maxTools` in `config/index.ts` comfortably above the current tool count, and add a pure, independently-testable `applyMaxTools` helper in `tools/index.ts` that `filterTools` uses to both slice the list and know exactly what it dropped, so it can `console.warn` the excluded tool names instead of dropping them silently. The default is *not* derived dynamically from `getAllTools().length` — `config/index.ts` would have to import from `tools/index.ts` to do that, inverting the existing dependency direction (`tools/index.ts` already imports `ConfigurationManager`). A static, generous default plus a loud warning gets the same safety without a circular import.

Issue #28 gets three changes, each independently reviewable: expose `name`/`strictName` on the `list_tasks` tool schema (the two-line fix Teresa identified — `TaskService.getAllTasks` already accepts both and passes them straight to the Clockify API), expose `page`/`page-size` for callers who want to paginate manually, and add a `MAX_PAGES` safety cap to the auto-paginate loop in `getAllTasks`, mirroring the existing cap in `TimeEntryService.getTimeEntriesInRange`.

**Tech Stack:** TypeScript 5.x, Node 18+, ESM modules, Zod 3.x, `@modelcontextprotocol/sdk`, vitest

## Global Constraints

- Work directly on `main` branch — no PRs (own project: `tallthom/claude-clockify`)
- All commits include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- `npm run build` (runs `tsc`) must pass clean after every task
- `noUnusedLocals` and `noUnusedParameters` are enabled in `tsconfig.json` — do not introduce unused variables
- ESM project (`"type": "module"`) — relative imports need `.js` extensions, matching every existing file in `server/src/`
- If `npm test` fails with `vitest: command not found`, `node_modules/` is stale — run `npm install` in `server/` first to restore the devDependencies already declared in `package.json`, then retry
- The tool-filtering tests in Task 1 construct a real `ConfigurationManager` and assume no `MAX_TOOLS`, `ENABLED_TOOL_CATEGORIES`, `ENABLED_TOOLS`, or `DISABLED_TOOLS` environment variables are set in the shell running `npm test` — those would override the defaults the tests are checking

---

## Files

| File | Change |
|------|--------|
| `server/src/config/index.ts` | Raise `maxTools` default from 50 to 100 (schema default and object literal default) |
| `server/src/tools/index.ts` | Add exported `applyMaxTools` helper; use it in `filterTools` to slice and warn; add `name`/`strictName`/`page`/`page-size` to the `list_tasks` tool's `inputSchema` |
| `server/src/api/services/task.service.ts` | Add `MAX_PAGES` constant and break condition to the auto-paginate loop in `getAllTasks` |
| `server/src/tests/toolFiltering.test.ts` | New — regression test for #27 plus unit tests for `applyMaxTools` and the warning behaviour |
| `server/src/tests/taskFiltering.test.ts` | New — regression test proving `list_tasks`'s schema silently strips `name`/`strictName`/`page`/`page-size` today, then proving the fix retains them |
| `server/src/tests/taskPagination.test.ts` | New — tests for the `MAX_PAGES` cap on `getAllTasks`, mirroring `timeEntryPagination.test.ts` |

---

## Task 1: Raise maxTools default and warn when tools are excluded (fixes #27)

**Files:**
- Modify: `server/src/config/index.ts:88` and `server/src/config/index.ts:104`
- Modify: `server/src/tools/index.ts` (new exported `applyMaxTools` function; `filterTools` method, lines 1227–1251)
- Test: `server/src/tests/toolFiltering.test.ts`

**Interfaces:**
- Produces: `export function applyMaxTools<T extends { name: string }>(tools: T[], maxTools: number): { kept: T[]; dropped: string[] }` — exported from `server/src/tools/index.ts`
- Consumes: `ConfigurationManager.getToolFiltering()` — returns `{ enabledCategories, enabledTools?, disabledTools?, maxTools }`
- Consumes: `ClockifyTools.getTools()` — returns `{ name, description, inputSchema, handler }[]`, already public
- Consumes: `ClockifyTools.getAvailableToolNames()` — returns `string[]` of all 54 registered tool names, unfiltered, already public

- [ ] **Step 1: Write the failing regression test**

Create `server/src/tests/toolFiltering.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { ClockifyTools, applyMaxTools } from '../tools/index.js';
import { ConfigurationManager } from '../config/index.js';

// Assumes no MAX_TOOLS / ENABLED_TOOL_CATEGORIES / ENABLED_TOOLS / DISABLED_TOOLS
// env vars are set in the shell running the test suite, so schema defaults apply.
function buildToolsWithDefaults() {
  const config = new ConfigurationManager({ apiKey: 'fake-key' });
  return new ClockifyTools('fake-key', config);
}

describe('default tool filtering (issue #27 regression)', () => {
  it('does not silently drop tools when the registered count exceeds the old maxTools of 50', () => {
    const tools = buildToolsWithDefaults();
    const enabledNames = tools.getTools().map(t => t.name);
    const totalRegistered = tools.getAvailableToolNames().length;

    expect(enabledNames).toContain('get_today_entries');
    expect(enabledNames).toContain('get_week_entries');
    expect(enabledNames).toContain('get_month_entries');
    expect(enabledNames).toContain('remove_user_from_project');
    expect(enabledNames.length).toBe(totalRegistered);
  });
});

describe('applyMaxTools', () => {
  it('keeps everything and reports nothing dropped when under the limit', () => {
    const result = applyMaxTools([{ name: 'a' }, { name: 'b' }], 5);
    expect(result.kept.map(t => t.name)).toEqual(['a', 'b']);
    expect(result.dropped).toEqual([]);
  });

  it('slices to maxTools and names the dropped tools in order', () => {
    const tools = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }];
    const result = applyMaxTools(tools, 2);
    expect(result.kept.map(t => t.name)).toEqual(['a', 'b']);
    expect(result.dropped).toEqual(['c', 'd']);
  });
});

describe('ClockifyTools warns when maxTools excludes registered tools', () => {
  it('logs the excluded tool names via console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = new ConfigurationManager({
      apiKey: 'fake-key',
      toolFiltering: { maxTools: 2, enabledCategories: ['user'] },
    });
    const tools = new ClockifyTools('fake-key', config);
    tools.getTools();

    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.mock.calls.map(call => call[0]).join(' ');
    // 'user' category has 3 tools (get_current_user, list_users, get_user) by
    // priority; maxTools=2 keeps the first two and drops get_user.
    expect(message).toContain('get_user');

    warnSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- toolFiltering
```

Expected: fails to even compile/run — `applyMaxTools` is not exported from `tools/index.ts` yet. The regression test (if it could run in isolation) would also fail: `enabledNames.length` would be 50, not 54, and the four named tools would be missing.

- [ ] **Step 3: Raise the maxTools default in config/index.ts**

In `server/src/config/index.ts`, line 88, change:

```ts
      maxTools: z.number().default(50).describe('Maximum number of tools to expose'),
```

to:

```ts
      maxTools: z.number().default(100).describe('Maximum number of tools to expose'),
```

And at line 104, change:

```ts
      maxTools: 50,
    })),
```

to:

```ts
      maxTools: 100,
    })),
```

- [ ] **Step 4: Add the applyMaxTools helper and wire it into filterTools**

In `server/src/tools/index.ts`, add this exported function immediately after the `ToolDefinition` interface (after line 40, before `export class ClockifyTools`):

```ts
export function applyMaxTools<T extends { name: string }>(
  tools: T[],
  maxTools: number
): { kept: T[]; dropped: string[] } {
  if (tools.length <= maxTools) {
    return { kept: tools, dropped: [] };
  }
  return {
    kept: tools.slice(0, maxTools),
    dropped: tools.slice(maxTools).map(tool => tool.name),
  };
}
```

Then replace the `filterTools` method (lines 1227–1251):

**Before:**
```ts
  private filterTools(allTools: ToolDefinition[]): ToolDefinition[] {
    const filtering = this.config.getToolFiltering();

    // If specific tools are enabled, only include those
    if (filtering.enabledTools && filtering.enabledTools.length > 0) {
      const enabledSet = new Set(filtering.enabledTools);
      return allTools.filter(tool => enabledSet.has(tool.name)).slice(0, filtering.maxTools);
    }

    // Filter by categories
    const enabledCategories = new Set(filtering.enabledCategories);
    let filteredTools = allTools.filter(tool => enabledCategories.has(tool.category as any));

    // Remove disabled tools
    if (filtering.disabledTools && filtering.disabledTools.length > 0) {
      const disabledSet = new Set(filtering.disabledTools);
      filteredTools = filteredTools.filter(tool => !disabledSet.has(tool.name));
    }

    // Sort by priority (lower number = higher priority)
    filteredTools.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    // Limit to max tools
    return filteredTools.slice(0, filtering.maxTools);
  }
```

**After:**
```ts
  private filterTools(allTools: ToolDefinition[]): ToolDefinition[] {
    const filtering = this.config.getToolFiltering();

    // If specific tools are enabled, only include those
    if (filtering.enabledTools && filtering.enabledTools.length > 0) {
      const enabledSet = new Set(filtering.enabledTools);
      const matched = allTools.filter(tool => enabledSet.has(tool.name));
      const { kept, dropped } = applyMaxTools(matched, filtering.maxTools);
      this.warnIfToolsDropped(dropped, filtering.maxTools);
      return kept;
    }

    // Filter by categories
    const enabledCategories = new Set(filtering.enabledCategories);
    let filteredTools = allTools.filter(tool => enabledCategories.has(tool.category as any));

    // Remove disabled tools
    if (filtering.disabledTools && filtering.disabledTools.length > 0) {
      const disabledSet = new Set(filtering.disabledTools);
      filteredTools = filteredTools.filter(tool => !disabledSet.has(tool.name));
    }

    // Sort by priority (lower number = higher priority)
    filteredTools.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    // Limit to max tools
    const { kept, dropped } = applyMaxTools(filteredTools, filtering.maxTools);
    this.warnIfToolsDropped(dropped, filtering.maxTools);
    return kept;
  }

  private warnIfToolsDropped(dropped: string[], maxTools: number): void {
    if (dropped.length === 0) return;
    console.warn(
      `Warning: maxTools is set to ${maxTools}, excluding ${dropped.length} tool(s) that would otherwise be enabled: ${dropped.join(', ')}. Raise MAX_TOOLS to expose them.`
    );
  }
```

- [ ] **Step 5: Run the tests to confirm they pass**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- toolFiltering
```

Expected: all tests in `toolFiltering.test.ts` pass.

- [ ] **Step 6: Run the full test suite and build**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test && npm run build
```

Expected: all existing tests still pass (nothing else touches `filterTools` or the config defaults), build exits 0.

- [ ] **Step 7: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/src/config/index.ts server/src/tools/index.ts server/src/tests/toolFiltering.test.ts
git commit -m "$(cat <<'EOF'
fix: raise maxTools default and warn when tools are excluded by the filter

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Expose name/strictName/page/page-size on list_tasks (fixes #28, primary)

**Files:**
- Modify: `server/src/tools/index.ts` (`list_tasks` tool definition, lines 948–965)
- Test: `server/src/tests/taskFiltering.test.ts`

**Interfaces:**
- Consumes: `TaskService.getAllTasks(workspaceId, projectId, options?: { isActive?, name?, strictName?, page?, 'page-size'? })` — already accepts all four fields, unchanged by this task
- Consumes: `ClockifyTools.getTools()` — same public method used in Task 1

- [ ] **Step 1: Write the failing regression test**

Create `server/src/tests/taskFiltering.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ClockifyTools } from '../tools/index.js';
import { ConfigurationManager } from '../config/index.js';

const VALID_WORKSPACE = '507f1f77bcf86cd799439011';
const VALID_PROJECT = '507f1f77bcf86cd799439012';

function getListTasksTool() {
  const config = new ConfigurationManager({ apiKey: 'fake-key' });
  const tools = new ClockifyTools('fake-key', config);
  const tool = tools.getTools().find(t => t.name === 'list_tasks');
  if (!tool) throw new Error('list_tasks tool not found');
  return tool;
}

describe('list_tasks inputSchema (issue #28 regression)', () => {
  it('retains a name filter instead of silently stripping it', () => {
    const tool = getListTasksTool();
    const result = tool.inputSchema.safeParse({
      workspaceId: VALID_WORKSPACE,
      projectId: VALID_PROJECT,
      name: 'Onboarding',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).name).toBe('Onboarding');
    }
  });

  it('retains a strictName filter', () => {
    const tool = getListTasksTool();
    const result = tool.inputSchema.safeParse({
      workspaceId: VALID_WORKSPACE,
      projectId: VALID_PROJECT,
      name: 'Onboarding',
      strictName: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).strictName).toBe(true);
    }
  });

  it('retains page and page-size for manual pagination', () => {
    const tool = getListTasksTool();
    const result = tool.inputSchema.safeParse({
      workspaceId: VALID_WORKSPACE,
      projectId: VALID_PROJECT,
      page: 2,
      'page-size': 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).page).toBe(2);
      expect((result.data as any)['page-size']).toBe(50);
    }
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- taskFiltering
```

Expected: all three tests fail — `result.data.name`, `.strictName`, `.page`, and `['page-size']` are all `undefined` because the current `list_tasks` schema only defines `workspaceId`, `projectId`, `isActive`, and Zod strips unrecognised keys by default.

- [ ] **Step 3: Add the fields to the list_tasks tool schema**

In `server/src/tools/index.ts`, replace the `list_tasks` tool definition (lines 948–965):

**Before:**
```ts
      {
        name: 'list_tasks',
        category: 'task',
        priority: 1,
        description: 'List all tasks in a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          isActive: z.boolean().optional().describe('Filter by active status'),
        }),
        handler: async (input: any) => {
          const tasks = await this.taskService.getAllTasks(
            input.workspaceId,
            input.projectId,
            input
          );
          return { success: true, data: tasks };
        },
      },
```

**After:**
```ts
      {
        name: 'list_tasks',
        category: 'task',
        priority: 1,
        description: 'List all tasks in a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          isActive: z.boolean().optional().describe('Filter by active status'),
          name: z
            .string()
            .optional()
            .describe('Filter by task name (partial match unless strictName is set)'),
          strictName: z.boolean().optional().describe('Require an exact match on name'),
          page: z
            .number()
            .optional()
            .describe('Page number (1-based) to fetch a single page instead of auto-paginating'),
          'page-size': z.number().optional().describe('Number of tasks per page'),
        }),
        handler: async (input: any) => {
          const tasks = await this.taskService.getAllTasks(
            input.workspaceId,
            input.projectId,
            input
          );
          return { success: true, data: tasks };
        },
      },
```

The handler is unchanged — it already forwards the whole parsed `input` object to `getAllTasks`, which already reads `name`, `strictName`, `page`, and `'page-size'` off that options object.

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- taskFiltering
```

Expected: all three tests pass.

- [ ] **Step 5: Verify build passes**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm run build
```

Expected: exits 0, no type errors. Note: the `'page-size'` key is a quoted string property, not a bare identifier — this is valid TypeScript/Zod and matches the key `TaskService.getAllTasks` already expects.

- [ ] **Step 6: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/src/tools/index.ts server/src/tests/taskFiltering.test.ts
git commit -m "$(cat <<'EOF'
fix: expose name, strictName, page, and page-size on list_tasks

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Cap auto-pagination in getAllTasks (fixes #28, secondary)

**Files:**
- Modify: `server/src/api/services/task.service.ts` (`getAllTasks`, lines 7–40)
- Test: `server/src/tests/taskPagination.test.ts`

**Interfaces:**
- Consumes: `TaskService.getAllTasks(workspaceId, projectId, options?)` — signature unchanged, only the auto-paginate loop's termination condition changes
- Produces: `getAllTasks` terminates after at most `MAX_PAGES` API calls when no explicit `page` is given

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/taskPagination.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { TaskService } from '../api/services/task.service.js';
import type { ClockifyApiClient } from '../api/client.js';

function makeFullPage(pageSize = 50) {
  return Array.from({ length: pageSize }, (_, i) => ({ id: `task-${i}`, name: `Task ${i}` }));
}

describe('getAllTasks pagination cap', () => {
  it('stops after MAX_PAGES even when every page is full', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue(makeFullPage()),
    } as unknown as ClockifyApiClient;

    const service = new TaskService(mockClient);
    const result = await service.getAllTasks('ws1', 'proj1');

    // MAX_PAGES = 10, each page has 50 tasks
    expect(result).toHaveLength(500);
    expect(mockClient.get).toHaveBeenCalledTimes(10);
  });

  it('stops early when a page is not full', async () => {
    const mockClient = {
      get: vi.fn()
        .mockResolvedValueOnce(makeFullPage())
        .mockResolvedValueOnce(makeFullPage(20)),
    } as unknown as ClockifyApiClient;

    const service = new TaskService(mockClient);
    const result = await service.getAllTasks('ws1', 'proj1');

    expect(result).toHaveLength(70);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run the test to confirm the first case fails (or times out)**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- taskPagination
```

Expected: "stops after MAX_PAGES" fails or hangs — the loop currently runs forever against a mock that always returns a full page, since there's no cap. "stops early when a page is not full" passes already (that behaviour already exists).

- [ ] **Step 3: Add MAX_PAGES constant and break condition**

In `server/src/api/services/task.service.ts`, add the constant after the imports (after line 2):

```ts
const MAX_PAGES = 10;
```

In `getAllTasks`, change the auto-paginate loop from:

```ts
    // Otherwise auto-paginate until we get a short page
    const pageSize = 50;
    const all: ClockifyTask[] = [];
    let page = 1;
    while (true) {
      const batch = await this.client.get<ClockifyTask[]>(
        `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        { ...options, page, 'page-size': pageSize }
      );
      all.push(...batch);
      if (batch.length < pageSize) break;
      page++;
    }
    return all;
```

to:

```ts
    // Otherwise auto-paginate until we get a short page
    const pageSize = 50;
    const all: ClockifyTask[] = [];
    let page = 1;
    while (true) {
      const batch = await this.client.get<ClockifyTask[]>(
        `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        { ...options, page, 'page-size': pageSize }
      );
      all.push(...batch);
      if (batch.length < pageSize) break;
      if (page >= MAX_PAGES) break;
      page++;
    }
    return all;
```

- [ ] **Step 4: Run the test to confirm both cases pass**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- taskPagination
```

Expected: both tests pass.

- [ ] **Step 5: Run the full test suite and build**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test && npm run build
```

Expected: all tests pass, build exits 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/src/api/services/task.service.ts server/src/tests/taskPagination.test.ts
git commit -m "$(cat <<'EOF'
fix: cap getAllTasks auto-pagination at MAX_PAGES, mirroring TimeEntryService

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Final verification and close issues

**Files:** None

- [ ] **Step 1: Run full build and test suite**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm run build && npm test
```

Expected: clean build, all tests pass (existing tests plus the three new files from Tasks 1–3).

- [ ] **Step 2: Close the two GitHub issues**

```bash
gh issue close 27 --repo tallthom/claude-clockify --comment "Fixed in commits on main: maxTools default raised from 50 to 100, and filterTools now warns via console.warn when maxTools excludes any registered tool."
gh issue close 28 --repo tallthom/claude-clockify --comment "Fixed in commits on main: list_tasks now exposes name, strictName, page, and page-size (already supported by TaskService.getAllTasks but never surfaced on the tool schema), and getAllTasks now caps auto-pagination at MAX_PAGES=10, mirroring TimeEntryService."
```

- [ ] **Step 3: Update session log**

Add an entry to `~/Claude/memory/session-log.md` covering: issues #27 and #28 fixed and closed, brief description of each fix, and a note that `maxTools` default is now 100 (in case future tool additions approach that number again).

**Note — not part of this plan:** these are code-level fixes on `main`, not a release. Per `memory/coding.md`, cutting an actual release (version bump, `.mcpb` rebuild, live integration test in Claude CLI and Cowork, GitHub release) is a separate, deliberate decision — raise it with Thom when he wants users to actually receive these fixes.

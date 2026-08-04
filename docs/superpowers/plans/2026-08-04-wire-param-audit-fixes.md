# Wire Param Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the systemic bug in [#29](https://github.com/tallthom/claude-clockify/issues/29): multi-word GET query params passed camelCase to `project.service.ts`, `user.service.ts`, and `client.service.ts` are silently ignored by the live Clockify API, which only honours kebab-case equivalents.

**Architecture:** Each of the three services gets the same destructure-and-rebuild fix already applied to `task.service.ts`'s `getAllTasks` for `isActive`/`strictName`: pull the camelCase fields that need translating out of `options`, rebuild a `wireParams` object with their kebab-case equivalents, and pass that (not the raw `options`) to `this.client.get`. Untouched fields pass through via `...rest` exactly as before.

Before writing this plan, three previously-uncertain fields from the issue were checked directly against the live Clockify API:
- `project.service.ts`'s `userStatus` is confirmed broken the same way (camelCase returns the unfiltered baseline; kebab `user-status` returns a different, filtered result) — **in scope, fix it**.
- `client.service.ts`'s `sortColumn`/`sortOrder` could not be tested live (this Clockify workspace has zero clients to sort), but the code shape is identical to the two already-confirmed instances in `project.service.ts` and `user.service.ts` — **in scope, fix it defensively**, noted in the code as unconfirmed-by-live-test.
- `user.service.ts`'s `includeRoles` was tested live and found to **already work correctly in camelCase** (a `roles` key appears on returned user objects whether the param is `includeRoles=true` or `include-roles=true`; it's absent with no param at all). **Out of scope — do not touch it.** This corrects the issue's original text, which listed it as "likely affected"; Task 4 includes a GitHub comment clarifying this.

None of the six params being fixed here are currently exposed on any MCP tool's `inputSchema` (`list_projects` only exposes `name`/`clientId`/`archived`/`page`/`pageSize`; `list_users`/`find_user_by_name` never surface sort params; there is no `list_clients` tool that surfaces them either). These bugs are latent today, not live-broken for any current user — the same trap `task.service.ts`'s `strictName` was in until this session's Task 2 exposed it. Fixing the service layer now means the next person who wires one of these fields up to a tool schema won't rediscover the same landmine.

**Not in scope, noted but not fixed here:** `list_projects`'s tool schema exposes a field named `pageSize` (camelCase) that gets passed straight through to `getAllProjects`, which expects the key `'page-size'` (kebab, quoted). That's a *tool-schema-to-service* naming mismatch, a different bug shape than this issue's *service-to-Clockify-API* mismatch. Worth its own issue; do not fix it as part of this plan.

**Tech Stack:** TypeScript 5.x, Node 18+, ESM modules, Zod 3.x, vitest

## Global Constraints

- Work directly on `main` branch, no PRs (own project: `tallthom/claude-clockify`)
- All commits include `Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>`
- `npm run build` (runs `tsc`) must pass clean after every task
- `noUnusedLocals` and `noUnusedParameters` are enabled in `tsconfig.json`, destructured variables that are only used to be renamed into `wireParams` are all referenced, so this should not fire, but check the build output if it does
- ESM project (`"type": "module"`), relative imports need `.js` extensions
- This is the third and final fix in the same release as #27 and #28; Thom wants it landed before the 1.2.1 version bump and `.mcpb` rebuild

---

## Files

| File | Change |
|------|--------|
| `server/src/api/services/project.service.ts` | Translate `strictName`, `clientStatus`, `userStatus`, `isTemplate`, `sortColumn`, `sortOrder` to their kebab-case wire equivalents in `getAllProjects` |
| `server/src/api/services/user.service.ts` | Translate `sortColumn`, `sortOrder` to kebab-case in `getAllUsers`; leave `includeRoles` untouched |
| `server/src/api/services/client.service.ts` | Translate `sortColumn`, `sortOrder` to kebab-case in `getAllClients` |
| `server/src/tests/projectWireParams.test.ts` | New — asserts outgoing wire params for `getAllProjects` |
| `server/src/tests/userWireParams.test.ts` | New — asserts outgoing wire params for `getAllUsers`, including that `includeRoles` is passed through unchanged |
| `server/src/tests/clientWireParams.test.ts` | New — asserts outgoing wire params for `getAllClients` |

---

## Task 1: Fix project.service.ts wire params

**Files:**
- Modify: `server/src/api/services/project.service.ts:7-26` (`getAllProjects`)
- Test: `server/src/tests/projectWireParams.test.ts`

**Interfaces:**
- Consumes: `ProjectService.getAllProjects(workspaceId, options?)` — signature unchanged; `options` keeps accepting `strictName`, `clientStatus`, `userStatus`, `isTemplate`, `sortColumn`, `sortOrder` as camelCase (that's the tool-facing/internal shape, only the outgoing wire params change)
- Produces: `getAllProjects` sends `strict-name-search`, `client-status`, `user-status`, `is-template`, `sort-column`, `sort-order` to `this.client.get`, never the camelCase originals

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/projectWireParams.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { ProjectService } from '../api/services/project.service.js';
import type { ClockifyApiClient } from '../api/client.js';

// Confirmed empirically against the real Clockify API: it silently ignores
// camelCase 'strictName'/'clientStatus'/'userStatus'/'isTemplate'/'sortColumn'/
// 'sortOrder' query params and only honours the kebab-case equivalents.

describe('getAllProjects wire params', () => {
  it('translates strictName to strict-name-search', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { name: 'Moodle', strictName: true });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('strict-name-search', true);
    expect(params).not.toHaveProperty('strictName');
  });

  it('translates clientStatus to client-status', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { clientStatus: 'ARCHIVED' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('client-status', 'ARCHIVED');
    expect(params).not.toHaveProperty('clientStatus');
  });

  it('translates userStatus to user-status', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { userStatus: 'ACTIVE' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('user-status', 'ACTIVE');
    expect(params).not.toHaveProperty('userStatus');
  });

  it('translates isTemplate to is-template', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { isTemplate: true });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('is-template', true);
    expect(params).not.toHaveProperty('isTemplate');
  });

  it('translates sortColumn and sortOrder to sort-column and sort-order', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { sortColumn: 'NAME', sortOrder: 'DESCENDING' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('sort-column', 'NAME');
    expect(params).toHaveProperty('sort-order', 'DESCENDING');
    expect(params).not.toHaveProperty('sortColumn');
    expect(params).not.toHaveProperty('sortOrder');
  });

  it('passes name, archived, page, and page-size through unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', {
      name: 'Moodle',
      archived: false,
      page: 2,
      'page-size': 10,
    });

    const [, params] = getMock.mock.calls[0];
    expect(params).toMatchObject({ name: 'Moodle', archived: false, page: 2, 'page-size': 10 });
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- projectWireParams
```

Expected: the first five tests fail, each `params` object contains the camelCase key instead of the kebab-case one (e.g. `strictName: true` instead of `strict-name-search: true`). The last test (passthrough fields) passes already.

- [ ] **Step 3: Apply the fix**

In `server/src/api/services/project.service.ts`, replace the `getAllProjects` method:

**Before:**
```ts
  async getAllProjects(
    workspaceId: string,
    options?: {
      archived?: boolean;
      name?: string;
      strictName?: boolean;
      clients?: string[];
      clientStatus?: 'ACTIVE' | 'ARCHIVED';
      users?: string[];
      userStatus?: 'ACTIVE';
      isTemplate?: boolean;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
      hydrated?: boolean;
      page?: number;
      'page-size'?: number;
    }
  ): Promise<ClockifyProject[]> {
    return this.client.get<ClockifyProject[]>(`/workspaces/${workspaceId}/projects`, options);
  }
```

**After:**
```ts
  async getAllProjects(
    workspaceId: string,
    options?: {
      archived?: boolean;
      name?: string;
      strictName?: boolean;
      clients?: string[];
      clientStatus?: 'ACTIVE' | 'ARCHIVED';
      users?: string[];
      userStatus?: 'ACTIVE';
      isTemplate?: boolean;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
      hydrated?: boolean;
      page?: number;
      'page-size'?: number;
    }
  ): Promise<ClockifyProject[]> {
    // Clockify's API expects kebab-case for these params (confirmed against the
    // live API — camelCase is silently ignored, matching page-size's convention).
    const { strictName, clientStatus, userStatus, isTemplate, sortColumn, sortOrder, ...rest } =
      options ?? {};
    const wireParams: Record<string, unknown> = { ...rest };
    if (strictName !== undefined) wireParams['strict-name-search'] = strictName;
    if (clientStatus !== undefined) wireParams['client-status'] = clientStatus;
    if (userStatus !== undefined) wireParams['user-status'] = userStatus;
    if (isTemplate !== undefined) wireParams['is-template'] = isTemplate;
    if (sortColumn !== undefined) wireParams['sort-column'] = sortColumn;
    if (sortOrder !== undefined) wireParams['sort-order'] = sortOrder;

    return this.client.get<ClockifyProject[]>(`/workspaces/${workspaceId}/projects`, wireParams);
  }
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- projectWireParams
```

Expected: all six tests pass.

- [ ] **Step 5: Run the full suite and build**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test && npm run build
```

Expected: all tests pass (existing suite plus the six new ones), build exits 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/src/api/services/project.service.ts server/src/tests/projectWireParams.test.ts
git commit -m "$(cat <<'EOF'
fix: translate project query params to Clockify's kebab-case wire format

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Fix user.service.ts wire params

**Files:**
- Modify: `server/src/api/services/user.service.ts:15-31` (`getAllUsers`)
- Test: `server/src/tests/userWireParams.test.ts`

**Interfaces:**
- Consumes: `UserService.getAllUsers(workspaceId, options?)` — signature unchanged
- Produces: `getAllUsers` sends `sort-column`/`sort-order` to `this.client.get`; `includeRoles` and every other field pass through exactly as given, camelCase and all — it already works correctly

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/userWireParams.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { UserService } from '../api/services/user.service.js';
import type { ClockifyApiClient } from '../api/client.js';

// Confirmed empirically against the real Clockify API: sortColumn/sortOrder
// are silently ignored and only the kebab-case equivalents work. includeRoles
// was also tested live and confirmed to already work correctly in camelCase —
// it must NOT be translated.

describe('getAllUsers wire params', () => {
  it('translates sortColumn and sortOrder to sort-column and sort-order', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new UserService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllUsers('ws1', { sortColumn: 'NAME', sortOrder: 'DESCENDING' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('sort-column', 'NAME');
    expect(params).toHaveProperty('sort-order', 'DESCENDING');
    expect(params).not.toHaveProperty('sortColumn');
    expect(params).not.toHaveProperty('sortOrder');
  });

  it('leaves includeRoles as camelCase, unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new UserService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllUsers('ws1', { includeRoles: true });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('includeRoles', true);
    expect(params).not.toHaveProperty('include-roles');
  });

  it('passes email, name, status, page, and page-size through unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new UserService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllUsers('ws1', {
      email: 'adrian@moodle.com',
      name: 'Adrian',
      status: 'ACTIVE',
      page: 1,
      'page-size': 10,
    });

    const [, params] = getMock.mock.calls[0];
    expect(params).toMatchObject({
      email: 'adrian@moodle.com',
      name: 'Adrian',
      status: 'ACTIVE',
      page: 1,
      'page-size': 10,
    });
  });
});
```

- [ ] **Step 2: Run the tests to confirm the first fails**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- userWireParams
```

Expected: "translates sortColumn and sortOrder" fails (`params` has `sortColumn`/`sortOrder`, not the kebab equivalents). The other two already pass, since `getAllUsers` doesn't translate anything yet.

- [ ] **Step 3: Apply the fix**

In `server/src/api/services/user.service.ts`, replace the `getAllUsers` method:

**Before:**
```ts
  async getAllUsers(
    workspaceId: string,
    options?: {
      email?: string;
      name?: string;
      status?: 'ACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'INACTIVE';
      memberships?: 'WORKSPACE' | 'PROJECT' | 'USERGROUP' | 'NONE';
      projectId?: string;
      includeRoles?: boolean;
      'page-size'?: number;
      page?: number;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
    }
  ): Promise<ClockifyUser[]> {
    return this.client.get<ClockifyUser[]>(`/workspaces/${workspaceId}/users`, options);
  }
```

**After:**
```ts
  async getAllUsers(
    workspaceId: string,
    options?: {
      email?: string;
      name?: string;
      status?: 'ACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'INACTIVE';
      memberships?: 'WORKSPACE' | 'PROJECT' | 'USERGROUP' | 'NONE';
      projectId?: string;
      includeRoles?: boolean;
      'page-size'?: number;
      page?: number;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
    }
  ): Promise<ClockifyUser[]> {
    // Clockify's API expects kebab-case for sort params (confirmed against the
    // live API). includeRoles was also tested live and confirmed to already
    // work correctly in camelCase, so it is intentionally left untouched.
    const { sortColumn, sortOrder, ...rest } = options ?? {};
    const wireParams: Record<string, unknown> = { ...rest };
    if (sortColumn !== undefined) wireParams['sort-column'] = sortColumn;
    if (sortOrder !== undefined) wireParams['sort-order'] = sortOrder;

    return this.client.get<ClockifyUser[]>(`/workspaces/${workspaceId}/users`, wireParams);
  }
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- userWireParams
```

Expected: all three tests pass.

- [ ] **Step 5: Run the full suite and build**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test && npm run build
```

Expected: all tests pass, build exits 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/src/api/services/user.service.ts server/src/tests/userWireParams.test.ts
git commit -m "$(cat <<'EOF'
fix: translate user sort params to Clockify's kebab-case wire format

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Fix client.service.ts wire params

**Files:**
- Modify: `server/src/api/services/client.service.ts:7-19` (`getAllClients`)
- Test: `server/src/tests/clientWireParams.test.ts`

**Interfaces:**
- Consumes: `ClientService.getAllClients(workspaceId, options?)` — signature unchanged
- Produces: `getAllClients` sends `sort-column`/`sort-order` to `this.client.get`

- [ ] **Step 1: Write the failing test**

Create `server/src/tests/clientWireParams.test.ts`:

```ts
import { describe, it, expect, vi } from 'vitest';
import { ClientService } from '../api/services/client.service.js';
import type { ClockifyApiClient } from '../api/client.js';

// Same code shape as the confirmed sortColumn/sortOrder bug in
// project.service.ts and user.service.ts. Not independently confirmed live
// (this Clockify workspace has zero clients to sort against), fixed
// defensively for consistency with the two confirmed instances.

describe('getAllClients wire params', () => {
  it('translates sortColumn and sortOrder to sort-column and sort-order', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ClientService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllClients('ws1', { sortColumn: 'NAME', sortOrder: 'DESCENDING' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('sort-column', 'NAME');
    expect(params).toHaveProperty('sort-order', 'DESCENDING');
    expect(params).not.toHaveProperty('sortColumn');
    expect(params).not.toHaveProperty('sortOrder');
  });

  it('passes name, archived, page, and page-size through unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ClientService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllClients('ws1', {
      name: 'Acme',
      archived: false,
      page: 1,
      'page-size': 10,
    });

    const [, params] = getMock.mock.calls[0];
    expect(params).toMatchObject({ name: 'Acme', archived: false, page: 1, 'page-size': 10 });
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- clientWireParams
```

Expected: "translates sortColumn and sortOrder" fails. The passthrough test already passes.

- [ ] **Step 3: Apply the fix**

In `server/src/api/services/client.service.ts`, replace the `getAllClients` method:

**Before:**
```ts
  async getAllClients(
    workspaceId: string,
    options?: {
      name?: string;
      archived?: boolean;
      page?: number;
      'page-size'?: number;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
    }
  ): Promise<ClockifyClient[]> {
    return this.client.get<ClockifyClient[]>(`/workspaces/${workspaceId}/clients`, options);
  }
```

**After:**
```ts
  async getAllClients(
    workspaceId: string,
    options?: {
      name?: string;
      archived?: boolean;
      page?: number;
      'page-size'?: number;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
    }
  ): Promise<ClockifyClient[]> {
    // Clockify's API expects kebab-case for sort params. Same shape as the
    // confirmed fixes in project.service.ts and user.service.ts; this one
    // could not be reconfirmed live (no clients exist in this workspace).
    const { sortColumn, sortOrder, ...rest } = options ?? {};
    const wireParams: Record<string, unknown> = { ...rest };
    if (sortColumn !== undefined) wireParams['sort-column'] = sortColumn;
    if (sortOrder !== undefined) wireParams['sort-order'] = sortOrder;

    return this.client.get<ClockifyClient[]>(`/workspaces/${workspaceId}/clients`, wireParams);
  }
```

- [ ] **Step 4: Run the tests to confirm they pass**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test -- clientWireParams
```

Expected: both tests pass.

- [ ] **Step 5: Run the full suite and build**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm test && npm run build
```

Expected: all tests pass, build exits 0.

- [ ] **Step 6: Commit**

```bash
cd /Users/thomw/Claude/claude-clockify
git add server/src/api/services/client.service.ts server/src/tests/clientWireParams.test.ts
git commit -m "$(cat <<'EOF'
fix: translate client sort params to Clockify's kebab-case wire format

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Final verification and close issue

**Files:** None

- [ ] **Step 1: Run full build and test suite**

```bash
cd /Users/thomw/Claude/claude-clockify/server && npm run build && npm test
```

Expected: clean build, all tests pass (existing suite plus the eleven new tests from Tasks 1 to 3).

- [ ] **Step 2: Close the GitHub issue**

```bash
gh issue close 29 --repo tallthom/claude-clockify --comment "Fixed in commits on main: project.service.ts (strictName, clientStatus, userStatus, isTemplate, sortColumn, sortOrder) and user.service.ts / client.service.ts (sortColumn, sortOrder) now translate to Clockify's kebab-case wire params. One correction to the original report: includeRoles on user.service.ts was tested live and found to already work correctly in camelCase, so it was intentionally left unchanged, not translated. client.service.ts's fix could not be reconfirmed live (this workspace has no clients to sort against) but mirrors the two confirmed instances exactly."
```

- [ ] **Step 3: Update session log**

Add an entry to `~/Claude/memory/session-log.md` covering: issue #29 fixed and closed, the three services touched, and the `includeRoles` correction to the original issue report.

**Note:** with this fix landed, all three issues from this release (#27, #28, #29) are closed on `main`. Per `memory/coding.md`, the release itself (version bump to 1.2.1, `.mcpb` rebuild, live integration test in Claude CLI and Cowork, GitHub release) is the next deliberate step when Thom is ready.

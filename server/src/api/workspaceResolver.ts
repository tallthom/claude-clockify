import { ClockifyApiClient } from './client.js';

// Cache is keyed by client instance so it shares the client's lifetime.
const workspaceCache = new WeakMap<ClockifyApiClient, string>();

export async function resolveWorkspaceId(client: ClockifyApiClient): Promise<string> {
  // Env var override takes priority; never cache it so changes are picked up immediately.
  const override = process.env.CLOCKIFY_WORKSPACE_ID;
  if (override) return override;

  const cached = workspaceCache.get(client);
  if (cached) return cached;

  // Auto-detect: fetch workspaces and use the first one
  const workspaces = await client.get<Array<{ id: string; name: string }>>('/workspaces');
  if (!workspaces || workspaces.length === 0) {
    throw new Error('No Clockify workspaces found for this API key');
  }

  workspaceCache.set(client, workspaces[0].id);
  console.error(`[claude-clockify] Auto-detected workspace: "${workspaces[0].name}" (${workspaces[0].id})`);
  return workspaces[0].id;
}

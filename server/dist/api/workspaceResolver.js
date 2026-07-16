// Cache is keyed by client instance so it shares the client's lifetime.
const workspaceCache = new WeakMap();
function assertWorkspaceAllowed(workspaceId, allowedWorkspaces) {
    if (allowedWorkspaces && allowedWorkspaces.length > 0 && !allowedWorkspaces.includes(workspaceId)) {
        throw new Error(`Workspace ${workspaceId} is not in the allowedWorkspaces list`);
    }
}
export async function resolveWorkspaceId(client, allowedWorkspaces) {
    // Env var override takes priority; never cache it so changes are picked up immediately.
    const override = process.env.CLOCKIFY_WORKSPACE_ID;
    if (override) {
        assertWorkspaceAllowed(override, allowedWorkspaces);
        return override;
    }
    const cached = workspaceCache.get(client);
    if (cached) {
        assertWorkspaceAllowed(cached, allowedWorkspaces);
        return cached;
    }
    // Auto-detect: fetch workspaces and use the first allowed one
    const workspaces = await client.get('/workspaces');
    if (!workspaces || workspaces.length === 0) {
        throw new Error('No Clockify workspaces found for this API key');
    }
    const candidates = allowedWorkspaces && allowedWorkspaces.length > 0
        ? workspaces.filter(w => allowedWorkspaces.includes(w.id))
        : workspaces;
    if (candidates.length === 0) {
        throw new Error('No Clockify workspaces found that match the allowedWorkspaces restriction');
    }
    workspaceCache.set(client, candidates[0].id);
    console.error(`[claude-clockify] Auto-detected workspace: "${candidates[0].name}" (${candidates[0].id})`);
    return candidates[0].id;
}
//# sourceMappingURL=workspaceResolver.js.map
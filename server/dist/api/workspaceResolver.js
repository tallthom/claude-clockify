let cachedWorkspaceId = null;
export async function resolveWorkspaceId(client) {
    // Env var override takes priority
    const override = process.env.CLOCKIFY_WORKSPACE_ID;
    if (override)
        return override;
    // Return cached value from previous call
    if (cachedWorkspaceId)
        return cachedWorkspaceId;
    // Auto-detect: fetch workspaces and use the first one
    const workspaces = await client.get('/workspaces');
    if (!workspaces || workspaces.length === 0) {
        throw new Error('No Clockify workspaces found for this API key');
    }
    cachedWorkspaceId = workspaces[0].id;
    console.error(`[claude-clockify] Auto-detected workspace: "${workspaces[0].name}" (${cachedWorkspaceId})`);
    return cachedWorkspaceId;
}
//# sourceMappingURL=workspaceResolver.js.map
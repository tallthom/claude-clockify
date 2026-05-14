export class WorkspaceService {
    client;
    constructor(client) {
        this.client = client;
    }
    async getAllWorkspaces() {
        return this.client.get('/workspaces');
    }
    async getWorkspaceById(workspaceId) {
        return this.client.get(`/workspaces/${workspaceId}`);
    }
    async createWorkspace(name) {
        return this.client.post('/workspaces', { name });
    }
    async updateWorkspace(workspaceId, data) {
        return this.client.put(`/workspaces/${workspaceId}`, data);
    }
    async deleteWorkspace(workspaceId) {
        return this.client.delete(`/workspaces/${workspaceId}`);
    }
    async getWorkspaceUsers(workspaceId) {
        return this.client.get(`/workspaces/${workspaceId}/users`);
    }
    async updateUserHourlyRate(workspaceId, userId, hourlyRate) {
        return this.client.put(`/workspaces/${workspaceId}/users/${userId}/hourly-rate`, hourlyRate);
    }
    async updateUserCostRate(workspaceId, userId, costRate) {
        return this.client.put(`/workspaces/${workspaceId}/users/${userId}/cost-rate`, costRate);
    }
}
//# sourceMappingURL=workspace.service.js.map
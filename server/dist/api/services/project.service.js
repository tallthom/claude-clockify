export class ProjectService {
    client;
    constructor(client) {
        this.client = client;
    }
    async getAllProjects(workspaceId, options) {
        return this.client.get(`/workspaces/${workspaceId}/projects`, options);
    }
    async getProjectById(workspaceId, projectId, options) {
        return this.client.get(`/workspaces/${workspaceId}/projects/${projectId}`, options);
    }
    async createProject(workspaceId, data) {
        return this.client.post(`/workspaces/${workspaceId}/projects`, data);
    }
    async updateProject(workspaceId, projectId, data) {
        return this.client.put(`/workspaces/${workspaceId}/projects/${projectId}`, data);
    }
    async deleteProject(workspaceId, projectId) {
        return this.client.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
    }
    async archiveProject(workspaceId, projectId) {
        return this.updateProject(workspaceId, projectId, { archived: true });
    }
    async unarchiveProject(workspaceId, projectId) {
        return this.updateProject(workspaceId, projectId, { archived: false });
    }
    async findProjectByName(workspaceId, name) {
        return this.getAllProjects(workspaceId, { name });
    }
    async getProjectsForClient(workspaceId, clientId) {
        return this.getAllProjects(workspaceId, { clients: [clientId] });
    }
    async addUserToProject(workspaceId, projectId, userId, data) {
        return this.client.post(`/workspaces/${workspaceId}/projects/${projectId}/users/${userId}`, data);
    }
    async removeUserFromProject(workspaceId, projectId, userId) {
        return this.client.delete(`/workspaces/${workspaceId}/projects/${projectId}/users/${userId}`);
    }
    async updateProjectEstimate(workspaceId, projectId, estimate) {
        return this.client.patch(`/workspaces/${workspaceId}/projects/${projectId}/estimate`, estimate);
    }
    async updateProjectMemberships(workspaceId, projectId, memberships) {
        return this.client.patch(`/workspaces/${workspaceId}/projects/${projectId}/memberships`, {
            memberships,
        });
    }
}
//# sourceMappingURL=project.service.js.map
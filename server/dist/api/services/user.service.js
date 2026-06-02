export class UserService {
    client;
    constructor(client) {
        this.client = client;
    }
    async getCurrentUser() {
        return this.client.get('/user');
    }
    async getUserById(workspaceId, userId) {
        return this.client.get(`/workspaces/${workspaceId}/users/${userId}`);
    }
    async getAllUsers(workspaceId, options) {
        return this.client.get(`/workspaces/${workspaceId}/users`, options);
    }
    async updateUser(workspaceId, userId, data) {
        return this.client.put(`/workspaces/${workspaceId}/users/${userId}`, data);
    }
    async findUserByEmail(workspaceId, email) {
        const users = await this.getAllUsers(workspaceId, { email });
        return users.length > 0 ? users[0] : null;
    }
    async findUserByName(workspaceId, name) {
        return this.getAllUsers(workspaceId, { name });
    }
    async addUserToWorkspace(workspaceId, email) {
        return this.client.post(`/workspaces/${workspaceId}/users`, { email });
    }
    async removeUserFromWorkspace(workspaceId, userId) {
        return this.client.delete(`/workspaces/${workspaceId}/users/${userId}`);
    }
    async setUserActiveStatus(workspaceId, userId, active) {
        return this.client.put(`/workspaces/${workspaceId}/users/${userId}/status`, {
            status: active ? 'ACTIVE' : 'INACTIVE',
        });
    }
}
//# sourceMappingURL=user.service.js.map
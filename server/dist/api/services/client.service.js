export class ClientService {
    client;
    constructor(client) {
        this.client = client;
    }
    async getAllClients(workspaceId, options) {
        return this.client.get(`/workspaces/${workspaceId}/clients`, options);
    }
    async getClientById(workspaceId, clientId) {
        return this.client.get(`/workspaces/${workspaceId}/clients/${clientId}`);
    }
    async createClient(workspaceId, data) {
        return this.client.post(`/workspaces/${workspaceId}/clients`, data);
    }
    async updateClient(workspaceId, clientId, data) {
        return this.client.put(`/workspaces/${workspaceId}/clients/${clientId}`, data);
    }
    async deleteClient(workspaceId, clientId) {
        return this.client.delete(`/workspaces/${workspaceId}/clients/${clientId}`);
    }
    async archiveClient(workspaceId, clientId) {
        return this.updateClient(workspaceId, clientId, { archived: true });
    }
    async unarchiveClient(workspaceId, clientId) {
        return this.updateClient(workspaceId, clientId, { archived: false });
    }
    async findClientByName(workspaceId, name) {
        return this.getAllClients(workspaceId, { name });
    }
    async getActiveClients(workspaceId) {
        return this.getAllClients(workspaceId, { archived: false });
    }
    async getArchivedClients(workspaceId) {
        return this.getAllClients(workspaceId, { archived: true });
    }
}
//# sourceMappingURL=client.service.js.map
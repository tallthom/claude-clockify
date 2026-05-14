export class CustomFieldService {
    client;
    constructor(client) {
        this.client = client;
    }
    async getAllCustomFields(workspaceId) {
        return this.client.get(`/workspaces/${workspaceId}/custom-fields`);
    }
    async createCustomField(workspaceId, data) {
        return this.client.post(`/workspaces/${workspaceId}/custom-fields`, data);
    }
    async updateCustomField(workspaceId, customFieldId, data) {
        return this.client.put(`/workspaces/${workspaceId}/custom-fields/${customFieldId}`, data);
    }
    async deleteCustomField(workspaceId, customFieldId) {
        await this.client.delete(`/workspaces/${workspaceId}/custom-fields/${customFieldId}`);
    }
    async getCustomFieldById(workspaceId, customFieldId) {
        return this.client.get(`/workspaces/${workspaceId}/custom-fields/${customFieldId}`);
    }
}
//# sourceMappingURL=customField.service.js.map
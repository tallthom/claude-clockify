export class TagService {
    client;
    constructor(client) {
        this.client = client;
    }
    async getAllTags(workspaceId, options) {
        return this.client.get(`/workspaces/${workspaceId}/tags`, options);
    }
    async getTagById(workspaceId, tagId) {
        return this.client.get(`/workspaces/${workspaceId}/tags/${tagId}`);
    }
    async createTag(workspaceId, data) {
        return this.client.post(`/workspaces/${workspaceId}/tags`, data);
    }
    async updateTag(workspaceId, tagId, data) {
        return this.client.put(`/workspaces/${workspaceId}/tags/${tagId}`, data);
    }
    async deleteTag(workspaceId, tagId) {
        return this.client.delete(`/workspaces/${workspaceId}/tags/${tagId}`);
    }
    async archiveTag(workspaceId, tagId) {
        return this.updateTag(workspaceId, tagId, { archived: true });
    }
    async unarchiveTag(workspaceId, tagId) {
        return this.updateTag(workspaceId, tagId, { archived: false });
    }
    async findTagByName(workspaceId, name) {
        return this.getAllTags(workspaceId, { name });
    }
    async getActiveTags(workspaceId) {
        return this.getAllTags(workspaceId, { archived: false });
    }
    async getArchivedTags(workspaceId) {
        return this.getAllTags(workspaceId, { archived: true });
    }
    async createMultipleTags(workspaceId, names) {
        const tags = [];
        for (const name of names) {
            const tag = await this.createTag(workspaceId, { name });
            tags.push(tag);
        }
        return tags;
    }
}
//# sourceMappingURL=tag.service.js.map
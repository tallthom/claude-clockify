export class TaskService {
    client;
    constructor(client) {
        this.client = client;
    }
    async getAllTasks(workspaceId, projectId, options) {
        return this.client.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, options);
    }
    async getTaskById(workspaceId, projectId, taskId) {
        return this.client.get(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
    }
    async createTask(workspaceId, projectId, data) {
        return this.client.post(`/workspaces/${workspaceId}/projects/${projectId}/tasks`, data);
    }
    async updateTask(workspaceId, projectId, taskId, data) {
        return this.client.put(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`, data);
    }
    async deleteTask(workspaceId, projectId, taskId) {
        return this.client.delete(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
    }
    async markTaskAsDone(workspaceId, projectId, taskId) {
        return this.updateTask(workspaceId, projectId, taskId, { status: 'DONE' });
    }
    async markTaskAsActive(workspaceId, projectId, taskId) {
        return this.updateTask(workspaceId, projectId, taskId, { status: 'ACTIVE' });
    }
    async findTaskByName(workspaceId, projectId, name) {
        return this.getAllTasks(workspaceId, projectId, { name });
    }
    async getActiveTasks(workspaceId, projectId) {
        return this.getAllTasks(workspaceId, projectId, { isActive: true });
    }
    async assignTaskToUsers(workspaceId, projectId, taskId, userIds) {
        return this.updateTask(workspaceId, projectId, taskId, { assigneeIds: userIds });
    }
    async updateTaskEstimate(workspaceId, projectId, taskId, estimate) {
        return this.updateTask(workspaceId, projectId, taskId, { estimate });
    }
    async createMultipleTasks(workspaceId, projectId, tasks) {
        const createdTasks = [];
        for (const task of tasks) {
            const created = await this.createTask(workspaceId, projectId, task);
            createdTasks.push(created);
        }
        return createdTasks;
    }
}
//# sourceMappingURL=task.service.js.map
import { ClockifyApiClient } from '../client.js';
import type { ClockifyTask } from '../../types/index.js';
export declare class TaskService {
    private client;
    constructor(client: ClockifyApiClient);
    getAllTasks(workspaceId: string, projectId: string, options?: {
        isActive?: boolean;
        name?: string;
        strictName?: boolean;
        page?: number;
        'page-size'?: number;
    }): Promise<ClockifyTask[]>;
    getTaskById(workspaceId: string, projectId: string, taskId: string): Promise<ClockifyTask>;
    createTask(workspaceId: string, projectId: string, data: {
        name: string;
        assigneeIds?: string[];
        estimate?: string;
        status?: 'ACTIVE' | 'DONE';
        billable?: boolean;
    }): Promise<ClockifyTask>;
    updateTask(workspaceId: string, projectId: string, taskId: string, data: {
        name?: string;
        assigneeIds?: string[];
        estimate?: string;
        status?: 'ACTIVE' | 'DONE';
        billable?: boolean;
    }): Promise<ClockifyTask>;
    deleteTask(workspaceId: string, projectId: string, taskId: string): Promise<void>;
    markTaskAsDone(workspaceId: string, projectId: string, taskId: string): Promise<ClockifyTask>;
    markTaskAsActive(workspaceId: string, projectId: string, taskId: string): Promise<ClockifyTask>;
    findTaskByName(workspaceId: string, projectId: string, name: string): Promise<ClockifyTask[]>;
    getActiveTasks(workspaceId: string, projectId: string): Promise<ClockifyTask[]>;
    assignTaskToUsers(workspaceId: string, projectId: string, taskId: string, userIds: string[]): Promise<ClockifyTask>;
    updateTaskEstimate(workspaceId: string, projectId: string, taskId: string, estimate: string): Promise<ClockifyTask>;
    createMultipleTasks(workspaceId: string, projectId: string, tasks: Array<{
        name: string;
        assigneeIds?: string[];
        estimate?: string;
    }>): Promise<ClockifyTask[]>;
}
//# sourceMappingURL=task.service.d.ts.map
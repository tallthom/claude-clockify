import { ClockifyApiClient } from '../client.js';
import type { ClockifyTask } from '../../types/index.js';

const MAX_PAGES = 10;

export class TaskService {
  constructor(private client: ClockifyApiClient) {}

  async getAllTasks(
    workspaceId: string,
    projectId: string,
    options?: {
      isActive?: boolean;
      name?: string;
      strictName?: boolean;
      page?: number;
      'page-size'?: number;
    }
  ): Promise<ClockifyTask[]> {
    // If caller requested a specific page, honour it directly
    if (options?.page !== undefined) {
      return this.client.get<ClockifyTask[]>(
        `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        options
      );
    }

    // Otherwise auto-paginate until we get a short page
    const pageSize = 50;
    const all: ClockifyTask[] = [];
    let page = 1;
    while (true) {
      const batch = await this.client.get<ClockifyTask[]>(
        `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        { ...options, page, 'page-size': pageSize }
      );
      all.push(...batch);
      if (batch.length < pageSize) break;
      if (page >= MAX_PAGES) break;
      page++;
    }
    return all;
  }

  async getTaskById(workspaceId: string, projectId: string, taskId: string): Promise<ClockifyTask> {
    return this.client.get<ClockifyTask>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`
    );
  }

  async createTask(
    workspaceId: string,
    projectId: string,
    data: {
      name: string;
      assigneeIds?: string[];
      estimate?: string;
      status?: 'ACTIVE' | 'DONE';
      billable?: boolean;
    }
  ): Promise<ClockifyTask> {
    return this.client.post<ClockifyTask>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
      data
    );
  }

  async updateTask(
    workspaceId: string,
    projectId: string,
    taskId: string,
    data: {
      name?: string;
      assigneeIds?: string[];
      estimate?: string;
      status?: 'ACTIVE' | 'DONE';
      billable?: boolean;
    }
  ): Promise<ClockifyTask> {
    return this.client.put<ClockifyTask>(
      `/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`,
      data
    );
  }

  async deleteTask(workspaceId: string, projectId: string, taskId: string): Promise<void> {
    return this.client.delete(`/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`);
  }

  async markTaskAsDone(
    workspaceId: string,
    projectId: string,
    taskId: string
  ): Promise<ClockifyTask> {
    return this.updateTask(workspaceId, projectId, taskId, { status: 'DONE' });
  }

  async markTaskAsActive(
    workspaceId: string,
    projectId: string,
    taskId: string
  ): Promise<ClockifyTask> {
    return this.updateTask(workspaceId, projectId, taskId, { status: 'ACTIVE' });
  }

  async findTaskByName(
    workspaceId: string,
    projectId: string,
    name: string
  ): Promise<ClockifyTask[]> {
    return this.getAllTasks(workspaceId, projectId, { name });
  }

  async getActiveTasks(workspaceId: string, projectId: string): Promise<ClockifyTask[]> {
    return this.getAllTasks(workspaceId, projectId, { isActive: true });
  }

  async assignTaskToUsers(
    workspaceId: string,
    projectId: string,
    taskId: string,
    userIds: string[]
  ): Promise<ClockifyTask> {
    return this.updateTask(workspaceId, projectId, taskId, { assigneeIds: userIds });
  }

  async updateTaskEstimate(
    workspaceId: string,
    projectId: string,
    taskId: string,
    estimate: string
  ): Promise<ClockifyTask> {
    return this.updateTask(workspaceId, projectId, taskId, { estimate });
  }

  async createMultipleTasks(
    workspaceId: string,
    projectId: string,
    tasks: Array<{
      name: string;
      assigneeIds?: string[];
      estimate?: string;
    }>
  ): Promise<ClockifyTask[]> {
    const createdTasks: ClockifyTask[] = [];
    for (const task of tasks) {
      const created = await this.createTask(workspaceId, projectId, task);
      createdTasks.push(created);
    }
    return createdTasks;
  }
}

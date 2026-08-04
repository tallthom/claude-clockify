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
    // Clockify's API expects kebab-case for these two params (confirmed against
    // the live API — camelCase is silently ignored, matching page-size's convention).
    const { isActive, strictName, ...rest } = options ?? {};
    const wireParams: Record<string, unknown> = { ...rest };
    if (isActive !== undefined) wireParams['is-active'] = isActive;
    if (strictName !== undefined) wireParams['strict-name-search'] = strictName;

    // If caller requested a specific page, honour it directly
    if (wireParams.page !== undefined) {
      return this.client.get<ClockifyTask[]>(
        `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        wireParams
      );
    }

    // Otherwise auto-paginate until we get a short page. Honour a caller-supplied
    // page-size instead of silently overwriting it with the default (a later
    // duplicate key in an object literal always wins, so leaving this as a bare
    // 50 clobbered any page-size the caller had put in wireParams via ...rest).
    const pageSize = typeof wireParams['page-size'] === 'number' ? (wireParams['page-size'] as number) : 50;
    const all: ClockifyTask[] = [];
    let page = 1;
    while (true) {
      const batch = await this.client.get<ClockifyTask[]>(
        `/workspaces/${workspaceId}/projects/${projectId}/tasks`,
        { ...wireParams, page, 'page-size': pageSize }
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

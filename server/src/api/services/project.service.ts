import { ClockifyApiClient } from '../client.js';
import type { ClockifyProject } from '../../types/index.js';

export class ProjectService {
  constructor(private client: ClockifyApiClient) {}

  async getAllProjects(
    workspaceId: string,
    options?: {
      archived?: boolean;
      name?: string;
      strictName?: boolean;
      clients?: string[];
      clientStatus?: 'ACTIVE' | 'ARCHIVED';
      users?: string[];
      userStatus?: 'ACTIVE';
      isTemplate?: boolean;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
      hydrated?: boolean;
      page?: number;
      'page-size'?: number;
    }
  ): Promise<ClockifyProject[]> {
    return this.client.get<ClockifyProject[]>(`/workspaces/${workspaceId}/projects`, options);
  }

  async getProjectById(
    workspaceId: string,
    projectId: string,
    options?: {
      hydrated?: boolean;
    }
  ): Promise<ClockifyProject> {
    return this.client.get<ClockifyProject>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
      options
    );
  }

  async createProject(
    workspaceId: string,
    data: {
      name: string;
      clientId?: string;
      isPublic?: boolean;
      estimate?: {
        estimate: string;
        type: 'AUTO' | 'MANUAL';
      };
      color?: string;
      note?: string;
      billable?: boolean;
      hourlyRate?: {
        amount: number;
        currency: string;
      };
    }
  ): Promise<ClockifyProject> {
    return this.client.post<ClockifyProject>(`/workspaces/${workspaceId}/projects`, data);
  }

  async updateProject(
    workspaceId: string,
    projectId: string,
    data: {
      name?: string;
      clientId?: string;
      isPublic?: boolean;
      estimate?: {
        estimate: string;
        type: 'AUTO' | 'MANUAL';
      };
      color?: string;
      note?: string;
      billable?: boolean;
      hourlyRate?: {
        amount: number;
        currency: string;
      };
      archived?: boolean;
    }
  ): Promise<ClockifyProject> {
    return this.client.put<ClockifyProject>(
      `/workspaces/${workspaceId}/projects/${projectId}`,
      data
    );
  }

  async deleteProject(workspaceId: string, projectId: string): Promise<void> {
    return this.client.delete(`/workspaces/${workspaceId}/projects/${projectId}`);
  }

  async archiveProject(workspaceId: string, projectId: string): Promise<ClockifyProject> {
    return this.updateProject(workspaceId, projectId, { archived: true });
  }

  async unarchiveProject(workspaceId: string, projectId: string): Promise<ClockifyProject> {
    return this.updateProject(workspaceId, projectId, { archived: false });
  }

  async findProjectByName(workspaceId: string, name: string): Promise<ClockifyProject[]> {
    return this.getAllProjects(workspaceId, { name });
  }

  async getProjectsForClient(workspaceId: string, clientId: string): Promise<ClockifyProject[]> {
    return this.getAllProjects(workspaceId, { clients: [clientId] });
  }

  async addUserToProject(
    workspaceId: string,
    projectId: string,
    userId: string,
    data?: {
      hourlyRate?: {
        amount: number;
        currency: string;
      };
    }
  ): Promise<any> {
    return this.client.post(
      `/workspaces/${workspaceId}/projects/${projectId}/users/${userId}`,
      data
    );
  }

  async removeUserFromProject(
    workspaceId: string,
    projectId: string,
    userId: string
  ): Promise<void> {
    return this.client.delete(`/workspaces/${workspaceId}/projects/${projectId}/users/${userId}`);
  }

  async updateProjectEstimate(
    workspaceId: string,
    projectId: string,
    estimate: {
      estimate: string;
      type: 'AUTO' | 'MANUAL';
    }
  ): Promise<ClockifyProject> {
    return this.client.patch<ClockifyProject>(
      `/workspaces/${workspaceId}/projects/${projectId}/estimate`,
      estimate
    );
  }

  async updateProjectMemberships(
    workspaceId: string,
    projectId: string,
    memberships: Array<{
      userId: string;
      hourlyRate?: {
        amount: number;
        currency: string;
      };
    }>
  ): Promise<ClockifyProject> {
    return this.client.patch<ClockifyProject>(
      `/workspaces/${workspaceId}/projects/${projectId}/memberships`,
      {
        memberships,
      }
    );
  }
}

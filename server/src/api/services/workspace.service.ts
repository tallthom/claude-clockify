import { ClockifyApiClient } from '../client.js';
import type { ClockifyWorkspace } from '../../types/index.js';

export class WorkspaceService {
  constructor(private client: ClockifyApiClient) {}

  async getAllWorkspaces(): Promise<ClockifyWorkspace[]> {
    return this.client.get<ClockifyWorkspace[]>('/workspaces');
  }

  async getWorkspaceById(workspaceId: string): Promise<ClockifyWorkspace> {
    return this.client.get<ClockifyWorkspace>(`/workspaces/${workspaceId}`);
  }

  async createWorkspace(name: string): Promise<ClockifyWorkspace> {
    return this.client.post<ClockifyWorkspace>('/workspaces', { name });
  }

  async updateWorkspace(
    workspaceId: string,
    data: {
      name?: string;
      imageUrl?: string;
      settings?: {
        timeRoundingInReports?: boolean;
        onlyAdminsSeeBillableRates?: boolean;
        onlyAdminsCreateProject?: boolean;
        onlyAdminsSeeDashboard?: boolean;
        defaultBillableProjects?: boolean;
        lockTimeEntries?: string;
        round?: {
          round: string;
          minutes: string;
        };
      };
    }
  ): Promise<ClockifyWorkspace> {
    return this.client.put<ClockifyWorkspace>(`/workspaces/${workspaceId}`, data);
  }

  async deleteWorkspace(workspaceId: string): Promise<void> {
    return this.client.delete(`/workspaces/${workspaceId}`);
  }

  async getWorkspaceUsers(workspaceId: string): Promise<any[]> {
    return this.client.get(`/workspaces/${workspaceId}/users`);
  }

  async updateUserHourlyRate(
    workspaceId: string,
    userId: string,
    hourlyRate: {
      amount: number;
      currency: string;
    }
  ): Promise<any> {
    return this.client.put(`/workspaces/${workspaceId}/users/${userId}/hourly-rate`, hourlyRate);
  }

  async updateUserCostRate(
    workspaceId: string,
    userId: string,
    costRate: {
      amount: number;
      currency: string;
    }
  ): Promise<any> {
    return this.client.put(`/workspaces/${workspaceId}/users/${userId}/cost-rate`, costRate);
  }
}

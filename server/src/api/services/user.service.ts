import { ClockifyApiClient } from '../client.js';
import type { ClockifyUser } from '../../types/index.js';

export class UserService {
  constructor(private client: ClockifyApiClient) {}

  async getCurrentUser(): Promise<ClockifyUser> {
    return this.client.get<ClockifyUser>('/user');
  }

  async getUserById(workspaceId: string, userId: string): Promise<ClockifyUser> {
    return this.client.get<ClockifyUser>(`/workspaces/${workspaceId}/users/${userId}`);
  }

  async getAllUsers(
    workspaceId: string,
    options?: {
      email?: string;
      name?: string;
      status?: 'ACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'INACTIVE';
      memberships?: 'WORKSPACE' | 'PROJECT' | 'USERGROUP' | 'NONE';
      projectId?: string;
      includeRoles?: boolean;
      'page-size'?: number;
      page?: number;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
    }
  ): Promise<ClockifyUser[]> {
    return this.client.get<ClockifyUser[]>(`/workspaces/${workspaceId}/users`, options);
  }

  async updateUser(
    workspaceId: string,
    userId: string,
    data: {
      name?: string;
      email?: string;
      timeZone?: string;
      weekStart?: string;
      timeFormat?: string;
      dateFormat?: string;
    }
  ): Promise<ClockifyUser> {
    return this.client.put<ClockifyUser>(`/workspaces/${workspaceId}/users/${userId}`, data);
  }

  async findUserByEmail(workspaceId: string, email: string): Promise<ClockifyUser | null> {
    const users = await this.getAllUsers(workspaceId, { email });
    return users.length > 0 ? users[0] : null;
  }

  async findUserByName(workspaceId: string, name: string): Promise<ClockifyUser[]> {
    return this.getAllUsers(workspaceId, { name });
  }

  async addUserToWorkspace(workspaceId: string, email: string): Promise<ClockifyUser> {
    return this.client.post<ClockifyUser>(`/workspaces/${workspaceId}/users`, { email });
  }

  async removeUserFromWorkspace(workspaceId: string, userId: string): Promise<void> {
    return this.client.delete(`/workspaces/${workspaceId}/users/${userId}`);
  }

  async setUserActiveStatus(
    workspaceId: string,
    userId: string,
    active: boolean
  ): Promise<ClockifyUser> {
    return this.client.put<ClockifyUser>(`/workspaces/${workspaceId}/users/${userId}/status`, {
      status: active ? 'ACTIVE' : 'INACTIVE',
    });
  }
}

import { ClockifyApiClient } from '../client.js';
import type { ClockifyClient } from '../../types/index.js';

export class ClientService {
  constructor(private client: ClockifyApiClient) {}

  async getAllClients(
    workspaceId: string,
    options?: {
      name?: string;
      archived?: boolean;
      page?: number;
      'page-size'?: number;
      sortColumn?: string;
      sortOrder?: 'ASCENDING' | 'DESCENDING';
    }
  ): Promise<ClockifyClient[]> {
    // Clockify's API expects kebab-case for sort params. Same shape as the
    // confirmed fixes in project.service.ts and user.service.ts; this one
    // could not be reconfirmed live (no clients exist in this workspace).
    const { sortColumn, sortOrder, ...rest } = options ?? {};
    const wireParams: Record<string, unknown> = { ...rest };
    if (sortColumn !== undefined) wireParams['sort-column'] = sortColumn;
    if (sortOrder !== undefined) wireParams['sort-order'] = sortOrder;

    return this.client.get<ClockifyClient[]>(`/workspaces/${workspaceId}/clients`, wireParams);
  }

  async getClientById(workspaceId: string, clientId: string): Promise<ClockifyClient> {
    return this.client.get<ClockifyClient>(`/workspaces/${workspaceId}/clients/${clientId}`);
  }

  async createClient(
    workspaceId: string,
    data: {
      name: string;
      address?: string;
      note?: string;
      email?: string;
    }
  ): Promise<ClockifyClient> {
    return this.client.post<ClockifyClient>(`/workspaces/${workspaceId}/clients`, data);
  }

  async updateClient(
    workspaceId: string,
    clientId: string,
    data: {
      name?: string;
      address?: string;
      note?: string;
      email?: string;
      archived?: boolean;
    }
  ): Promise<ClockifyClient> {
    return this.client.put<ClockifyClient>(`/workspaces/${workspaceId}/clients/${clientId}`, data);
  }

  async deleteClient(workspaceId: string, clientId: string): Promise<void> {
    return this.client.delete(`/workspaces/${workspaceId}/clients/${clientId}`);
  }

  async archiveClient(workspaceId: string, clientId: string): Promise<ClockifyClient> {
    return this.updateClient(workspaceId, clientId, { archived: true });
  }

  async unarchiveClient(workspaceId: string, clientId: string): Promise<ClockifyClient> {
    return this.updateClient(workspaceId, clientId, { archived: false });
  }

  async findClientByName(workspaceId: string, name: string): Promise<ClockifyClient[]> {
    return this.getAllClients(workspaceId, { name });
  }

  async getActiveClients(workspaceId: string): Promise<ClockifyClient[]> {
    return this.getAllClients(workspaceId, { archived: false });
  }

  async getArchivedClients(workspaceId: string): Promise<ClockifyClient[]> {
    return this.getAllClients(workspaceId, { archived: true });
  }
}

import type { ClockifyCustomField, ClockifyCustomFieldRequest } from '../../types/index.js';
import type { ClockifyApiClient } from '../client.js';

export class CustomFieldService {
  constructor(private client: ClockifyApiClient) {}

  async getAllCustomFields(workspaceId: string): Promise<ClockifyCustomField[]> {
    return this.client.get<ClockifyCustomField[]>(`/workspaces/${workspaceId}/custom-fields`);
  }

  async createCustomField(
    workspaceId: string,
    data: ClockifyCustomFieldRequest
  ): Promise<ClockifyCustomField> {
    return this.client.post<ClockifyCustomField>(`/workspaces/${workspaceId}/custom-fields`, data);
  }

  async updateCustomField(
    workspaceId: string,
    customFieldId: string,
    data: Partial<ClockifyCustomFieldRequest>
  ): Promise<ClockifyCustomField> {
    return this.client.put<ClockifyCustomField>(
      `/workspaces/${workspaceId}/custom-fields/${customFieldId}`,
      data
    );
  }

  async deleteCustomField(workspaceId: string, customFieldId: string): Promise<void> {
    await this.client.delete(`/workspaces/${workspaceId}/custom-fields/${customFieldId}`);
  }

  async getCustomFieldById(
    workspaceId: string,
    customFieldId: string
  ): Promise<ClockifyCustomField> {
    return this.client.get<ClockifyCustomField>(
      `/workspaces/${workspaceId}/custom-fields/${customFieldId}`
    );
  }
}

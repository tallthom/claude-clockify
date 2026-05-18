import { ClockifyApiClient } from '../client.js';
import type { ClockifyTag } from '../../types/index.js';

export class TagService {
  constructor(private client: ClockifyApiClient) {}

  async getAllTags(
    workspaceId: string,
    options?: {
      name?: string;
      archived?: boolean;
      page?: number;
      'page-size'?: number;
    }
  ): Promise<ClockifyTag[]> {
    return this.client.get<ClockifyTag[]>(`/workspaces/${workspaceId}/tags`, options);
  }

  async getTagById(workspaceId: string, tagId: string): Promise<ClockifyTag> {
    return this.client.get<ClockifyTag>(`/workspaces/${workspaceId}/tags/${tagId}`);
  }

  async createTag(
    workspaceId: string,
    data: {
      name: string;
    }
  ): Promise<ClockifyTag> {
    return this.client.post<ClockifyTag>(`/workspaces/${workspaceId}/tags`, data);
  }

  async updateTag(
    workspaceId: string,
    tagId: string,
    data: {
      name?: string;
      archived?: boolean;
    }
  ): Promise<ClockifyTag> {
    return this.client.put<ClockifyTag>(`/workspaces/${workspaceId}/tags/${tagId}`, data);
  }

  async deleteTag(workspaceId: string, tagId: string): Promise<void> {
    return this.client.delete(`/workspaces/${workspaceId}/tags/${tagId}`);
  }

  async archiveTag(workspaceId: string, tagId: string): Promise<ClockifyTag> {
    return this.updateTag(workspaceId, tagId, { archived: true });
  }

  async unarchiveTag(workspaceId: string, tagId: string): Promise<ClockifyTag> {
    return this.updateTag(workspaceId, tagId, { archived: false });
  }

  async findTagByName(workspaceId: string, name: string): Promise<ClockifyTag[]> {
    return this.getAllTags(workspaceId, { name });
  }

  async getActiveTags(workspaceId: string): Promise<ClockifyTag[]> {
    return this.getAllTags(workspaceId, { archived: false });
  }

  async getArchivedTags(workspaceId: string): Promise<ClockifyTag[]> {
    return this.getAllTags(workspaceId, { archived: true });
  }

  async createMultipleTags(workspaceId: string, names: string[]): Promise<ClockifyTag[]> {
    const tags: ClockifyTag[] = [];
    for (const name of names) {
      const tag = await this.createTag(workspaceId, { name });
      tags.push(tag);
    }
    return tags;
  }
}

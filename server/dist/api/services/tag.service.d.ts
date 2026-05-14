import { ClockifyApiClient } from '../client.js';
import type { ClockifyTag } from '../../types/index.js';
export declare class TagService {
    private client;
    constructor(client: ClockifyApiClient);
    getAllTags(workspaceId: string, options?: {
        name?: string;
        archived?: boolean;
        page?: number;
        'page-size'?: number;
    }): Promise<ClockifyTag[]>;
    getTagById(workspaceId: string, tagId: string): Promise<ClockifyTag>;
    createTag(workspaceId: string, data: {
        name: string;
    }): Promise<ClockifyTag>;
    updateTag(workspaceId: string, tagId: string, data: {
        name?: string;
        archived?: boolean;
    }): Promise<ClockifyTag>;
    deleteTag(workspaceId: string, tagId: string): Promise<void>;
    archiveTag(workspaceId: string, tagId: string): Promise<ClockifyTag>;
    unarchiveTag(workspaceId: string, tagId: string): Promise<ClockifyTag>;
    findTagByName(workspaceId: string, name: string): Promise<ClockifyTag[]>;
    getActiveTags(workspaceId: string): Promise<ClockifyTag[]>;
    getArchivedTags(workspaceId: string): Promise<ClockifyTag[]>;
    createMultipleTags(workspaceId: string, names: string[]): Promise<ClockifyTag[]>;
}
//# sourceMappingURL=tag.service.d.ts.map
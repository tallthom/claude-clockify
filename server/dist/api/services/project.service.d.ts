import { ClockifyApiClient } from '../client.js';
import type { ClockifyProject } from '../../types/index.js';
export declare class ProjectService {
    private client;
    constructor(client: ClockifyApiClient);
    getAllProjects(workspaceId: string, options?: {
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
    }): Promise<ClockifyProject[]>;
    getProjectById(workspaceId: string, projectId: string, options?: {
        hydrated?: boolean;
    }): Promise<ClockifyProject>;
    createProject(workspaceId: string, data: {
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
    }): Promise<ClockifyProject>;
    updateProject(workspaceId: string, projectId: string, data: {
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
    }): Promise<ClockifyProject>;
    deleteProject(workspaceId: string, projectId: string): Promise<void>;
    archiveProject(workspaceId: string, projectId: string): Promise<ClockifyProject>;
    unarchiveProject(workspaceId: string, projectId: string): Promise<ClockifyProject>;
    findProjectByName(workspaceId: string, name: string): Promise<ClockifyProject[]>;
    getProjectsForClient(workspaceId: string, clientId: string): Promise<ClockifyProject[]>;
    addUserToProject(workspaceId: string, projectId: string, userId: string, data?: {
        hourlyRate?: {
            amount: number;
            currency: string;
        };
    }): Promise<any>;
    removeUserFromProject(workspaceId: string, projectId: string, userId: string): Promise<void>;
    updateProjectEstimate(workspaceId: string, projectId: string, estimate: {
        estimate: string;
        type: 'AUTO' | 'MANUAL';
    }): Promise<ClockifyProject>;
    updateProjectMemberships(workspaceId: string, projectId: string, memberships: Array<{
        userId: string;
        hourlyRate?: {
            amount: number;
            currency: string;
        };
    }>): Promise<ClockifyProject>;
}
//# sourceMappingURL=project.service.d.ts.map
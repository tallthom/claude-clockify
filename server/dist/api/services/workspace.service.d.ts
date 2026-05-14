import { ClockifyApiClient } from '../client.js';
import type { ClockifyWorkspace } from '../../types/index.js';
export declare class WorkspaceService {
    private client;
    constructor(client: ClockifyApiClient);
    getAllWorkspaces(): Promise<ClockifyWorkspace[]>;
    getWorkspaceById(workspaceId: string): Promise<ClockifyWorkspace>;
    createWorkspace(name: string): Promise<ClockifyWorkspace>;
    updateWorkspace(workspaceId: string, data: {
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
    }): Promise<ClockifyWorkspace>;
    deleteWorkspace(workspaceId: string): Promise<void>;
    getWorkspaceUsers(workspaceId: string): Promise<any[]>;
    updateUserHourlyRate(workspaceId: string, userId: string, hourlyRate: {
        amount: number;
        currency: string;
    }): Promise<any>;
    updateUserCostRate(workspaceId: string, userId: string, costRate: {
        amount: number;
        currency: string;
    }): Promise<any>;
}
//# sourceMappingURL=workspace.service.d.ts.map
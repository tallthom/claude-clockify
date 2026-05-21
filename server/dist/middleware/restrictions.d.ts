import { ConfigurationManager } from '../config/index.js';
import { ClockifyApiClient } from '../api/client.js';
export declare class RestrictionMiddleware {
    private config;
    private client?;
    constructor(config: ConfigurationManager, client?: ClockifyApiClient | undefined);
    checkProjectAccess(projectId?: string): void;
    checkWorkspaceAccess(workspaceId?: string): void;
    checkOperation(operation: string): void;
    applyDefaults<T extends Record<string, any>>(params: T): Promise<T>;
    filterProjects<T extends {
        id: string;
    }>(projects: T[]): T[];
    filterWorkspaces<T extends {
        id: string;
    }>(workspaces: T[]): T[];
    validateToolAccess(toolName: string, params: any): void;
}
//# sourceMappingURL=restrictions.d.ts.map
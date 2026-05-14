import { ConfigurationManager } from '../config/index.js';
export declare class RestrictionMiddleware {
    private config;
    constructor(config: ConfigurationManager);
    checkProjectAccess(projectId?: string): void;
    checkWorkspaceAccess(workspaceId?: string): void;
    checkOperation(operation: string): void;
    checkTimeEntryDates(start: string, end?: string): void;
    applyDefaults<T extends Record<string, any>>(params: T): T;
    filterProjects<T extends {
        id: string;
    }>(projects: T[]): T[];
    filterWorkspaces<T extends {
        id: string;
    }>(workspaces: T[]): T[];
    validateToolAccess(toolName: string, params: any): void;
}
//# sourceMappingURL=restrictions.d.ts.map
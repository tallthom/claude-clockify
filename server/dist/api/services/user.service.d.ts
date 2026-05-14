import { ClockifyApiClient } from '../client.js';
import type { ClockifyUser } from '../../types/index.js';
export declare class UserService {
    private client;
    constructor(client: ClockifyApiClient);
    getCurrentUser(): Promise<ClockifyUser>;
    getUserById(workspaceId: string, userId: string): Promise<ClockifyUser>;
    getAllUsers(workspaceId: string, options?: {
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
    }): Promise<ClockifyUser[]>;
    updateUser(workspaceId: string, userId: string, data: {
        name?: string;
        email?: string;
        timeZone?: string;
        weekStart?: string;
        timeFormat?: string;
        dateFormat?: string;
    }): Promise<ClockifyUser>;
    findUserByEmail(workspaceId: string, email: string): Promise<ClockifyUser | null>;
    findUserByName(workspaceId: string, name: string): Promise<ClockifyUser[]>;
    addUserToWorkspace(workspaceId: string, email: string): Promise<ClockifyUser>;
    removeUserFromWorkspace(workspaceId: string, userId: string): Promise<void>;
    setUserActiveStatus(workspaceId: string, userId: string, active: boolean): Promise<ClockifyUser>;
}
//# sourceMappingURL=user.service.d.ts.map
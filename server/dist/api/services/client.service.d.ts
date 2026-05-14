import { ClockifyApiClient } from '../client.js';
import type { ClockifyClient } from '../../types/index.js';
export declare class ClientService {
    private client;
    constructor(client: ClockifyApiClient);
    getAllClients(workspaceId: string, options?: {
        name?: string;
        archived?: boolean;
        page?: number;
        'page-size'?: number;
        sortColumn?: string;
        sortOrder?: 'ASCENDING' | 'DESCENDING';
    }): Promise<ClockifyClient[]>;
    getClientById(workspaceId: string, clientId: string): Promise<ClockifyClient>;
    createClient(workspaceId: string, data: {
        name: string;
        address?: string;
        note?: string;
        email?: string;
    }): Promise<ClockifyClient>;
    updateClient(workspaceId: string, clientId: string, data: {
        name?: string;
        address?: string;
        note?: string;
        email?: string;
        archived?: boolean;
    }): Promise<ClockifyClient>;
    deleteClient(workspaceId: string, clientId: string): Promise<void>;
    archiveClient(workspaceId: string, clientId: string): Promise<ClockifyClient>;
    unarchiveClient(workspaceId: string, clientId: string): Promise<ClockifyClient>;
    findClientByName(workspaceId: string, name: string): Promise<ClockifyClient[]>;
    getActiveClients(workspaceId: string): Promise<ClockifyClient[]>;
    getArchivedClients(workspaceId: string): Promise<ClockifyClient[]>;
}
//# sourceMappingURL=client.service.d.ts.map
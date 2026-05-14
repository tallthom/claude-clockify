import type { ClockifyCustomField, ClockifyCustomFieldRequest } from '../../types/index.js';
import type { ClockifyApiClient } from '../client.js';
export declare class CustomFieldService {
    private client;
    constructor(client: ClockifyApiClient);
    getAllCustomFields(workspaceId: string): Promise<ClockifyCustomField[]>;
    createCustomField(workspaceId: string, data: ClockifyCustomFieldRequest): Promise<ClockifyCustomField>;
    updateCustomField(workspaceId: string, customFieldId: string, data: Partial<ClockifyCustomFieldRequest>): Promise<ClockifyCustomField>;
    deleteCustomField(workspaceId: string, customFieldId: string): Promise<void>;
    getCustomFieldById(workspaceId: string, customFieldId: string): Promise<ClockifyCustomField>;
}
//# sourceMappingURL=customField.service.d.ts.map
import { ClockifyApiClient } from '../client.js';
import type { ClockifyTimeEntry, ClockifyTimeEntryRequest } from '../../types/index.js';
export declare class TimeEntryService {
    private client;
    constructor(client: ClockifyApiClient);
    createTimeEntry(workspaceId: string, data: ClockifyTimeEntryRequest): Promise<ClockifyTimeEntry>;
    getTimeEntriesForUser(workspaceId: string, userId: string, options?: {
        description?: string;
        start?: string;
        end?: string;
        project?: string;
        task?: string;
        tags?: string[];
        'project-required'?: boolean;
        'task-required'?: boolean;
        hydrated?: boolean;
        page?: number;
        'page-size'?: number;
    }): Promise<ClockifyTimeEntry[]>;
    getTimeEntryById(workspaceId: string, timeEntryId: string, options?: {
        hydrated?: boolean;
    }): Promise<ClockifyTimeEntry>;
    updateTimeEntry(workspaceId: string, timeEntryId: string, data: {
        start?: string;
        billable?: boolean;
        description?: string;
        projectId?: string;
        taskId?: string;
        end?: string;
        tagIds?: string[];
        hourlyRate?: {
            amount: number;
            currency: string;
        };
        costRate?: {
            amount: number;
            currency: string;
        };
        type?: 'REGULAR' | 'BREAK' | 'CLOCK_IN_OUT';
        kioskId?: string;
        customFields?: Array<{
            customFieldId: string;
            value: string | number | boolean;
            sourceType?: string;
            name?: string;
            type?: string;
        }>;
    }): Promise<ClockifyTimeEntry>;
    deleteTimeEntry(workspaceId: string, timeEntryId: string): Promise<void>;
    stopRunningTimer(workspaceId: string, userId: string, data: {
        end: string;
    }): Promise<ClockifyTimeEntry>;
    getRunningTimeEntry(workspaceId: string, userId: string): Promise<ClockifyTimeEntry | null>;
    bulkEditTimeEntries(workspaceId: string, timeEntryIds: string[], data: {
        billable?: boolean;
        projectId?: string;
        taskId?: string;
        tagIds?: string[];
    }): Promise<any>;
    bulkDeleteTimeEntries(workspaceId: string, timeEntryIds: string[]): Promise<void>;
    duplicateTimeEntry(workspaceId: string, timeEntryId: string): Promise<ClockifyTimeEntry>;
    getTimeEntriesInRange(workspaceId: string, userId: string, startDate: Date, endDate: Date): Promise<ClockifyTimeEntry[]>;
    getTodayTimeEntries(workspaceId: string, userId: string): Promise<ClockifyTimeEntry[]>;
    getWeekTimeEntries(workspaceId: string, userId: string): Promise<ClockifyTimeEntry[]>;
    getMonthTimeEntries(workspaceId: string, userId: string, year?: number, month?: number): Promise<ClockifyTimeEntry[]>;
}
//# sourceMappingURL=timeEntry.service.d.ts.map
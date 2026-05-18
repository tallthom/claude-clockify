import { ClockifyApiClient } from '../client.js';
import type { ClockifyTimeEntry, ClockifyTimeEntryRequest } from '../../types/index.js';

export class TimeEntryService {
  constructor(private client: ClockifyApiClient) {}

  async createTimeEntry(
    workspaceId: string,
    data: ClockifyTimeEntryRequest
  ): Promise<ClockifyTimeEntry> {
    return this.client.post<ClockifyTimeEntry>(`/workspaces/${workspaceId}/time-entries`, data);
  }

  async getTimeEntriesForUser(
    workspaceId: string,
    userId: string,
    options?: {
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
    }
  ): Promise<ClockifyTimeEntry[]> {
    return this.client.get<ClockifyTimeEntry[]>(
      `/workspaces/${workspaceId}/user/${userId}/time-entries`,
      options
    );
  }

  async getTimeEntryById(
    workspaceId: string,
    timeEntryId: string,
    options?: {
      hydrated?: boolean;
    }
  ): Promise<ClockifyTimeEntry> {
    return this.client.get<ClockifyTimeEntry>(
      `/workspaces/${workspaceId}/time-entries/${timeEntryId}`,
      options
    );
  }

  async updateTimeEntry(
    workspaceId: string,
    timeEntryId: string,
    data: {
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
    }
  ): Promise<ClockifyTimeEntry> {
    return this.client.put<ClockifyTimeEntry>(
      `/workspaces/${workspaceId}/time-entries/${timeEntryId}`,
      data
    );
  }

  async deleteTimeEntry(workspaceId: string, timeEntryId: string): Promise<void> {
    return this.client.delete(`/workspaces/${workspaceId}/time-entries/${timeEntryId}`);
  }

  async stopRunningTimer(
    workspaceId: string,
    userId: string,
    data: {
      end: string;
    }
  ): Promise<ClockifyTimeEntry> {
    return this.client.patch<ClockifyTimeEntry>(
      `/workspaces/${workspaceId}/user/${userId}/time-entries`,
      data
    );
  }

  async getRunningTimeEntry(
    workspaceId: string,
    userId: string
  ): Promise<ClockifyTimeEntry | null> {
    const entries = await this.getTimeEntriesForUser(workspaceId, userId, {
      'page-size': 1,
    });

    if (entries.length > 0 && !entries[0].timeInterval.end) {
      return entries[0];
    }

    return null;
  }

  async bulkEditTimeEntries(
    workspaceId: string,
    timeEntryIds: string[],
    data: {
      billable?: boolean;
      projectId?: string;
      taskId?: string;
      tagIds?: string[];
    }
  ): Promise<any> {
    return this.client.patch(`/workspaces/${workspaceId}/time-entries/bulk`, {
      timeEntryIds,
      ...data,
    });
  }

  async bulkDeleteTimeEntries(workspaceId: string, timeEntryIds: string[]): Promise<void> {
    return this.client.post(`/workspaces/${workspaceId}/time-entries/delete`, {
      timeEntryIds,
    });
  }

  async duplicateTimeEntry(workspaceId: string, timeEntryId: string): Promise<ClockifyTimeEntry> {
    const original = await this.getTimeEntryById(workspaceId, timeEntryId);

    const now = new Date();

    return this.createTimeEntry(workspaceId, {
      start: now.toISOString(),
      description: original.description,
      projectId: original.projectId,
      taskId: original.taskId,
      tagIds: original.tagIds,
      billable: original.billable,
    });
  }

  async getTimeEntriesInRange(
    workspaceId: string,
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ClockifyTimeEntry[]> {
    return this.getTimeEntriesForUser(workspaceId, userId, {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    });
  }

  async getTodayTimeEntries(workspaceId: string, userId: string): Promise<ClockifyTimeEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getTimeEntriesInRange(workspaceId, userId, today, tomorrow);
  }

  async getWeekTimeEntries(workspaceId: string, userId: string): Promise<ClockifyTimeEntry[]> {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    return this.getTimeEntriesInRange(workspaceId, userId, startOfWeek, endOfWeek);
  }

  async getMonthTimeEntries(
    workspaceId: string,
    userId: string,
    year?: number,
    month?: number
  ): Promise<ClockifyTimeEntry[]> {
    const now = new Date();
    const targetYear = year || now.getFullYear();
    const targetMonth = month !== undefined ? month : now.getMonth();

    const startOfMonth = new Date(targetYear, targetMonth, 1);
    const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);

    return this.getTimeEntriesInRange(workspaceId, userId, startOfMonth, endOfMonth);
  }
}

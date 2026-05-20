import { ClockifyApiClient } from '../client.js';
import type { ClockifyTimeEntry, ClockifyTimeEntryRequest } from '../../types/index.js';

// Returns "YYYY-MM-DD" from a Date using UTC fields
function utcDateString(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export class TimeEntryService {
  constructor(private client: ClockifyApiClient) {}

  async createTimeEntry(
    workspaceId: string,
    data: ClockifyTimeEntryRequest
  ): Promise<ClockifyTimeEntry> {
    const payload = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== null && v !== undefined)
    );
    return this.client.post<ClockifyTimeEntry>(`/workspaces/${workspaceId}/time-entries`, payload);
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
    start: string,
    end: string
  ): Promise<ClockifyTimeEntry[]> {
    return this.getTimeEntriesForUser(workspaceId, userId, {
      start,
      end,
      'page-size': 200,
    });
  }

  async getTodayTimeEntries(workspaceId: string, userId: string): Promise<ClockifyTimeEntry[]> {
    const today = utcDateString(new Date());
    return this.getTimeEntriesInRange(
      workspaceId, userId,
      `${today}T00:00:00Z`,
      `${today}T23:59:59Z`
    );
  }

  async getWeekTimeEntries(workspaceId: string, userId: string): Promise<ClockifyTimeEntry[]> {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0=Sun
    const monday = new Date(now);
    monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));
    const sunday = new Date(monday);
    sunday.setUTCDate(monday.getUTCDate() + 6);

    return this.getTimeEntriesInRange(
      workspaceId, userId,
      `${utcDateString(monday)}T00:00:00Z`,
      `${utcDateString(sunday)}T23:59:59Z`
    );
  }

  async getMonthTimeEntries(
    workspaceId: string,
    userId: string,
    year?: number,
    month?: number
  ): Promise<ClockifyTimeEntry[]> {
    const now = new Date();
    const y = year ?? now.getUTCFullYear();
    const m = month !== undefined ? month : now.getUTCMonth(); // 0-indexed

    const firstDay = new Date(Date.UTC(y, m, 1));
    const lastDay = new Date(Date.UTC(y, m + 1, 0)); // day 0 of next month = last day of this month

    return this.getTimeEntriesInRange(
      workspaceId, userId,
      `${utcDateString(firstDay)}T00:00:00Z`,
      `${utcDateString(lastDay)}T23:59:59Z`
    );
  }
}

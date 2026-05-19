import { execFileSync } from 'child_process';
import { ClockifyApiClient } from '../client.js';
import type { ClockifyTimeEntry, ClockifyTimeEntryRequest } from '../../types/index.js';

function getSystemTimezone(): string {
  if (process.env.CLOCKIFY_TIMEZONE) return process.env.CLOCKIFY_TIMEZONE;
  try {
    if (process.platform === 'win32') {
      const raw = execFileSync('tzutil', ['/g'], { encoding: 'utf8' }).trim();
      // Convert Windows timezone name to IANA if possible, fall through to Intl otherwise
      const mapped = windowsToIana(raw);
      if (mapped) return mapped;
    } else {
      const link = execFileSync('readlink', ['/etc/localtime'], { encoding: 'utf8' }).trim();
      return link.replace(/.*zoneinfo\//, '');
    }
  } catch { /* fall through */ }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function windowsToIana(win: string): string | null {
  // Minimal map for common zones — extend as needed
  const map: Record<string, string> = {
    'Tokyo Standard Time': 'Asia/Tokyo',
    'UTC': 'UTC',
    'GMT Standard Time': 'Europe/London',
    'Central European Standard Time': 'Europe/Paris',
    'Eastern Standard Time': 'America/New_York',
    'Central Standard Time': 'America/Chicago',
    'Mountain Standard Time': 'America/Denver',
    'Pacific Standard Time': 'America/Los_Angeles',
    'AUS Eastern Standard Time': 'Australia/Sydney',
  };
  return map[win] ?? null;
}

const SYSTEM_TZ = getSystemTimezone();

function localMidnight(date: Date): Date {
  // Get the local date in SYSTEM_TZ
  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SYSTEM_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const y = parseInt(dateParts.find(p => p.type === 'year')!.value);
  const mo = parseInt(dateParts.find(p => p.type === 'month')!.value) - 1;
  const d = parseInt(dateParts.find(p => p.type === 'day')!.value);

  // Get the UTC offset at noon on that day in SYSTEM_TZ (safe from DST boundary issues)
  const noonUtc = Date.UTC(y, mo, d, 12, 0, 0);
  const offsetParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SYSTEM_TZ, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(noonUtc));
  const localHour = parseInt(offsetParts.find(p => p.type === 'hour')!.value);
  const localMin = parseInt(offsetParts.find(p => p.type === 'minute')!.value);
  const offsetMs = (localHour * 60 + localMin - 12 * 60) * 60 * 1000;

  // Midnight local = midnight UTC shifted by offset
  return new Date(Date.UTC(y, mo, d, 0, 0, 0) - offsetMs);
}

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
    const today = localMidnight(new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.getTimeEntriesInRange(workspaceId, userId, today, tomorrow);
  }

  async getWeekTimeEntries(workspaceId: string, userId: string): Promise<ClockifyTimeEntry[]> {
    const today = localMidnight(new Date());
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

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

    const startOfMonth = localMidnight(new Date(targetYear, targetMonth, 1));
    const endOfMonth = localMidnight(new Date(targetYear, targetMonth + 1, 1));

    return this.getTimeEntriesInRange(workspaceId, userId, startOfMonth, endOfMonth);
  }
}

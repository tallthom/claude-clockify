import { execFileSync } from 'child_process';
function getSystemTimezone() {
    if (process.env.CLOCKIFY_TIMEZONE)
        return process.env.CLOCKIFY_TIMEZONE;
    try {
        if (process.platform === 'win32') {
            const raw = execFileSync('tzutil', ['/g'], { encoding: 'utf8' }).trim();
            // Convert Windows timezone name to IANA if possible, fall through to Intl otherwise
            const mapped = windowsToIana(raw);
            if (mapped)
                return mapped;
        }
        else {
            const link = execFileSync('readlink', ['/etc/localtime'], { encoding: 'utf8' }).trim();
            return link.replace(/.*zoneinfo\//, '');
        }
    }
    catch { /* fall through */ }
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
}
function windowsToIana(win) {
    // Minimal map for common zones — extend as needed
    const map = {
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
function localMidnight(date) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: SYSTEM_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(date);
    const y = parts.find(p => p.type === 'year').value;
    const m = parts.find(p => p.type === 'month').value;
    const d = parts.find(p => p.type === 'day').value;
    return new Date(`${y}-${m}-${d}T00:00:00`);
}
export class TimeEntryService {
    client;
    constructor(client) {
        this.client = client;
    }
    async createTimeEntry(workspaceId, data) {
        return this.client.post(`/workspaces/${workspaceId}/time-entries`, data);
    }
    async getTimeEntriesForUser(workspaceId, userId, options) {
        return this.client.get(`/workspaces/${workspaceId}/user/${userId}/time-entries`, options);
    }
    async getTimeEntryById(workspaceId, timeEntryId, options) {
        return this.client.get(`/workspaces/${workspaceId}/time-entries/${timeEntryId}`, options);
    }
    async updateTimeEntry(workspaceId, timeEntryId, data) {
        return this.client.put(`/workspaces/${workspaceId}/time-entries/${timeEntryId}`, data);
    }
    async deleteTimeEntry(workspaceId, timeEntryId) {
        return this.client.delete(`/workspaces/${workspaceId}/time-entries/${timeEntryId}`);
    }
    async stopRunningTimer(workspaceId, userId, data) {
        return this.client.patch(`/workspaces/${workspaceId}/user/${userId}/time-entries`, data);
    }
    async getRunningTimeEntry(workspaceId, userId) {
        const entries = await this.getTimeEntriesForUser(workspaceId, userId, {
            'page-size': 1,
        });
        if (entries.length > 0 && !entries[0].timeInterval.end) {
            return entries[0];
        }
        return null;
    }
    async bulkEditTimeEntries(workspaceId, timeEntryIds, data) {
        return this.client.patch(`/workspaces/${workspaceId}/time-entries/bulk`, {
            timeEntryIds,
            ...data,
        });
    }
    async bulkDeleteTimeEntries(workspaceId, timeEntryIds) {
        return this.client.post(`/workspaces/${workspaceId}/time-entries/delete`, {
            timeEntryIds,
        });
    }
    async duplicateTimeEntry(workspaceId, timeEntryId) {
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
    async getTimeEntriesInRange(workspaceId, userId, startDate, endDate) {
        return this.getTimeEntriesForUser(workspaceId, userId, {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
        });
    }
    async getTodayTimeEntries(workspaceId, userId) {
        const today = localMidnight(new Date());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return this.getTimeEntriesInRange(workspaceId, userId, today, tomorrow);
    }
    async getWeekTimeEntries(workspaceId, userId) {
        const today = localMidnight(new Date());
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return this.getTimeEntriesInRange(workspaceId, userId, startOfWeek, endOfWeek);
    }
    async getMonthTimeEntries(workspaceId, userId, year, month) {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month !== undefined ? month : now.getMonth();
        const startOfMonth = localMidnight(new Date(targetYear, targetMonth, 1));
        const endOfMonth = localMidnight(new Date(targetYear, targetMonth + 1, 1));
        return this.getTimeEntriesInRange(workspaceId, userId, startOfMonth, endOfMonth);
    }
}
//# sourceMappingURL=timeEntry.service.js.map
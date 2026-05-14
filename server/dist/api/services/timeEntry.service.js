export class TimeEntryService {
    client;
    constructor(client) {
        this.client = client;
    }
    async createTimeEntry(workspaceId, data) {
        return this.client.post(`/workspaces/${workspaceId}/time-entries`, data);
    }
    async getTimeEntriesForUser(workspaceId, userId, options) {
        // If a specific page-size was requested (e.g. page-size: 1 for running timer), honour it
        if (options?.['page-size']) {
            return this.client.get(`/workspaces/${workspaceId}/user/${userId}/time-entries`, options);
        }
        // Otherwise paginate through all results automatically
        const allEntries = [];
        const pageSize = 50;
        let page = 1;
        while (true) {
            const batch = await this.client.get(`/workspaces/${workspaceId}/user/${userId}/time-entries`, { ...options, 'page-size': pageSize, page });
            allEntries.push(...batch);
            if (batch.length < pageSize)
                break;
            page++;
        }
        return allEntries;
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
        // Use the user's local timezone offset to correctly define "today"
        // This ensures users in UTC+ timezones (e.g. JST = UTC+9) get the right day boundary
        const now = new Date();
        const offsetMs = now.getTimezoneOffset() * 60 * 1000;
        // Start of today in local time, expressed as UTC
        const localMidnight = new Date(now);
        localMidnight.setHours(0, 0, 0, 0);
        const startUtc = new Date(localMidnight.getTime() - offsetMs);
        // End of today in local time
        const localEndOfDay = new Date(localMidnight);
        localEndOfDay.setDate(localEndOfDay.getDate() + 1);
        const endUtc = new Date(localEndOfDay.getTime() - offsetMs);
        return this.getTimeEntriesInRange(workspaceId, userId, startUtc, endUtc);
    }
    async getWeekTimeEntries(workspaceId, userId) {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);
        return this.getTimeEntriesInRange(workspaceId, userId, startOfWeek, endOfWeek);
    }
    async getMonthTimeEntries(workspaceId, userId, year, month) {
        const now = new Date();
        const targetYear = year || now.getFullYear();
        const targetMonth = month !== undefined ? month : now.getMonth();
        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
        return this.getTimeEntriesInRange(workspaceId, userId, startOfMonth, endOfMonth);
    }
}
//# sourceMappingURL=timeEntry.service.js.map
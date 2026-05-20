// Returns "YYYY-MM-DD" from a Date using UTC fields
function utcDateString(date) {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
export class TimeEntryService {
    client;
    constructor(client) {
        this.client = client;
    }
    async createTimeEntry(workspaceId, data) {
        const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== null && v !== undefined));
        return this.client.post(`/workspaces/${workspaceId}/time-entries`, payload);
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
    async getTimeEntriesInRange(workspaceId, userId, start, end) {
        return this.getTimeEntriesForUser(workspaceId, userId, {
            start,
            end,
            'page-size': 200,
        });
    }
    async getTodayTimeEntries(workspaceId, userId) {
        const today = utcDateString(new Date());
        return this.getTimeEntriesInRange(workspaceId, userId, `${today}T00:00:00Z`, `${today}T23:59:59Z`);
    }
    async getWeekTimeEntries(workspaceId, userId) {
        const now = new Date();
        const dayOfWeek = now.getUTCDay(); // 0=Sun
        const monday = new Date(now);
        monday.setUTCDate(now.getUTCDate() - ((dayOfWeek + 6) % 7));
        const sunday = new Date(monday);
        sunday.setUTCDate(monday.getUTCDate() + 6);
        return this.getTimeEntriesInRange(workspaceId, userId, `${utcDateString(monday)}T00:00:00Z`, `${utcDateString(sunday)}T23:59:59Z`);
    }
    async getMonthTimeEntries(workspaceId, userId, year, month) {
        const now = new Date();
        const y = year ?? now.getUTCFullYear();
        const m = month !== undefined ? month : now.getUTCMonth(); // 0-indexed
        const firstDay = new Date(Date.UTC(y, m, 1));
        const lastDay = new Date(Date.UTC(y, m + 1, 0)); // day 0 of next month = last day of this month
        return this.getTimeEntriesInRange(workspaceId, userId, `${utcDateString(firstDay)}T00:00:00Z`, `${utcDateString(lastDay)}T23:59:59Z`);
    }
}
//# sourceMappingURL=timeEntry.service.js.map
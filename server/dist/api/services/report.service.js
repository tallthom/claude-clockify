export class ReportService {
    client;
    constructor(client) {
        this.client = client;
    }
    async getSummaryReport(workspaceId, request) {
        return this.client.post(`/workspaces/${workspaceId}/reports/summary`, request);
    }
    async getDetailedReport(workspaceId, request) {
        return this.client.post(`/workspaces/${workspaceId}/reports/detailed`, request);
    }
    async getWeeklyReport(workspaceId, request) {
        return this.client.post(`/workspaces/${workspaceId}/reports/weekly`, request);
    }
    async exportReport(workspaceId, format, request) {
        const exportRequest = {
            ...request,
            exportType: format,
        };
        return this.client.post(`/workspaces/${workspaceId}/reports/summary/export`, exportRequest);
    }
    async getUserProductivityReport(workspaceId, userId, dateRange) {
        return this.getSummaryReport(workspaceId, {
            dateRangeStart: dateRange.start,
            dateRangeEnd: dateRange.end,
            users: {
                ids: [userId],
                contains: 'CONTAINS',
            },
            summaryFilter: {
                groups: ['USER', 'PROJECT', 'DATE'],
            },
        });
    }
    async getProjectProgressReport(workspaceId, projectId, dateRange) {
        return this.getSummaryReport(workspaceId, {
            dateRangeStart: dateRange.start,
            dateRangeEnd: dateRange.end,
            projects: {
                ids: [projectId],
                contains: 'CONTAINS',
            },
            summaryFilter: {
                groups: ['PROJECT', 'TASK', 'USER'],
            },
        });
    }
    async getClientBillingReport(workspaceId, clientId, dateRange) {
        return this.getSummaryReport(workspaceId, {
            dateRangeStart: dateRange.start,
            dateRangeEnd: dateRange.end,
            clients: {
                ids: [clientId],
                contains: 'CONTAINS',
            },
            billable: 'BILLABLE',
            amountShown: 'EARNED',
            summaryFilter: {
                groups: ['CLIENT', 'PROJECT', 'USER'],
            },
        });
    }
    async getTeamUtilizationReport(workspaceId, dateRange) {
        return this.getSummaryReport(workspaceId, {
            dateRangeStart: dateRange.start,
            dateRangeEnd: dateRange.end,
            summaryFilter: {
                groups: ['USER', 'DATE'],
                sortColumn: 'DURATION',
            },
            sortOrder: 'DESCENDING',
        });
    }
    async getTagAnalysisReport(workspaceId, tagIds, dateRange) {
        return this.getSummaryReport(workspaceId, {
            dateRangeStart: dateRange.start,
            dateRangeEnd: dateRange.end,
            tags: {
                ids: tagIds,
                contains: 'CONTAINS',
            },
            summaryFilter: {
                groups: ['TAG', 'PROJECT', 'USER'],
            },
        });
    }
    async getDailyTimeReport(workspaceId, userId, date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        return this.getDetailedReport(workspaceId, {
            dateRangeStart: startOfDay.toISOString(),
            dateRangeEnd: endOfDay.toISOString(),
            users: {
                ids: [userId],
                contains: 'CONTAINS',
            },
            detailedFilter: {
                sortColumn: 'DATE',
                sortOrder: 'ASCENDING',
            },
        });
    }
    async getMonthlyHoursReport(workspaceId, year, month) {
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
        return this.getSummaryReport(workspaceId, {
            dateRangeStart: startOfMonth.toISOString(),
            dateRangeEnd: endOfMonth.toISOString(),
            summaryFilter: {
                groups: ['USER', 'PROJECT'],
                sortColumn: 'DURATION',
            },
            sortOrder: 'DESCENDING',
        });
    }
}
//# sourceMappingURL=report.service.js.map
import { ClockifyApiClient } from '../client.js';
import type { ClockifyReportRequest, ClockifyReportResponse } from '../../types/index.js';
export declare class ReportService {
    private client;
    constructor(client: ClockifyApiClient);
    getSummaryReport(workspaceId: string, request: ClockifyReportRequest): Promise<ClockifyReportResponse>;
    getDetailedReport(workspaceId: string, request: ClockifyReportRequest & {
        detailedFilter?: {
            page?: number;
            pageSize?: number;
            sortColumn?: string;
            sortOrder?: 'ASCENDING' | 'DESCENDING';
            options?: {
                totals?: 'CALCULATE' | 'EXCLUDE';
            };
        };
    }): Promise<any>;
    getWeeklyReport(workspaceId: string, request: {
        dateRangeStart: string;
        dateRangeEnd: string;
        users?: string[];
        projects?: string[];
        clients?: string[];
    }): Promise<any>;
    exportReport(workspaceId: string, format: 'CSV' | 'PDF' | 'EXCEL', request: ClockifyReportRequest): Promise<any>;
    getUserProductivityReport(workspaceId: string, userId: string, dateRange: {
        start: string;
        end: string;
    }): Promise<any>;
    getProjectProgressReport(workspaceId: string, projectId: string, dateRange: {
        start: string;
        end: string;
    }): Promise<any>;
    getClientBillingReport(workspaceId: string, clientId: string, dateRange: {
        start: string;
        end: string;
    }): Promise<any>;
    getTeamUtilizationReport(workspaceId: string, dateRange: {
        start: string;
        end: string;
    }): Promise<any>;
    getTagAnalysisReport(workspaceId: string, tagIds: string[], dateRange: {
        start: string;
        end: string;
    }): Promise<any>;
    getDailyTimeReport(workspaceId: string, userId: string, date: string): Promise<any>;
    getMonthlyHoursReport(workspaceId: string, year: number, month: number): Promise<any>;
}
//# sourceMappingURL=report.service.d.ts.map
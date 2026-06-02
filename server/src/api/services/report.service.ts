import { ClockifyApiClient } from '../client.js';
import type { ClockifyReportRequest, ClockifyReportResponse } from '../../types/index.js';

export class ReportService {
  constructor(private client: ClockifyApiClient) {}

  async getSummaryReport(
    workspaceId: string,
    request: ClockifyReportRequest
  ): Promise<ClockifyReportResponse> {
    return this.client.post<ClockifyReportResponse>(
      `/workspaces/${workspaceId}/reports/summary`,
      request
    );
  }

  async getDetailedReport(
    workspaceId: string,
    request: ClockifyReportRequest & {
      detailedFilter?: {
        page?: number;
        pageSize?: number;
        sortColumn?: string;
        sortOrder?: 'ASCENDING' | 'DESCENDING';
        options?: {
          totals?: 'CALCULATE' | 'EXCLUDE';
        };
      };
    }
  ): Promise<any> {
    return this.client.post(`/workspaces/${workspaceId}/reports/detailed`, request);
  }

  async getWeeklyReport(
    workspaceId: string,
    request: {
      dateRangeStart: string;
      dateRangeEnd: string;
      users?: string[];
      projects?: string[];
      clients?: string[];
    }
  ): Promise<any> {
    return this.client.post(`/workspaces/${workspaceId}/reports/weekly`, request);
  }

  async exportReport(
    workspaceId: string,
    format: 'CSV' | 'PDF' | 'EXCEL',
    request: ClockifyReportRequest
  ): Promise<any> {
    const exportRequest = {
      ...request,
      exportType: format,
    };

    return this.client.post(`/workspaces/${workspaceId}/reports/summary/export`, exportRequest);
  }

  async getUserProductivityReport(
    workspaceId: string,
    userId: string,
    dateRange: {
      start: string;
      end: string;
    }
  ): Promise<any> {
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

  async getProjectProgressReport(
    workspaceId: string,
    projectId: string,
    dateRange: {
      start: string;
      end: string;
    }
  ): Promise<any> {
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

  async getClientBillingReport(
    workspaceId: string,
    clientId: string,
    dateRange: {
      start: string;
      end: string;
    }
  ): Promise<any> {
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

  async getTeamUtilizationReport(
    workspaceId: string,
    dateRange: {
      start: string;
      end: string;
    }
  ): Promise<any> {
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

  async getTagAnalysisReport(
    workspaceId: string,
    tagIds: string[],
    dateRange: {
      start: string;
      end: string;
    }
  ): Promise<any> {
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

  async getDailyTimeReport(workspaceId: string, userId: string, date: string): Promise<any> {
    // date is expected as "YYYY-MM-DD"; build UTC boundaries directly to avoid local-time shift
    const datePart = date.slice(0, 10);
    const startOfDay = new Date(`${datePart}T00:00:00.000Z`);
    const endOfDay = new Date(`${datePart}T23:59:59.999Z`);

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

  async getMonthlyHoursReport(workspaceId: string, year: number, month: number): Promise<any> {
    const startOfMonth = new Date(Date.UTC(year, month, 1));
    const endOfMonth = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

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

import { describe, it, expect, vi } from 'vitest';
import { TimeEntryService } from '../api/services/timeEntry.service.js';
function makeFullPage(pageSize = 1000) {
    return Array.from({ length: pageSize }, (_, i) => ({
        id: `entry-${i}`,
        description: '',
        userId: 'user1',
        workspaceId: 'ws1',
        projectId: null,
        taskId: null,
        tagIds: [],
        billable: false,
        isLocked: false,
        type: 'REGULAR',
        timeInterval: { start: '2026-01-01T00:00:00Z', end: '2026-01-01T01:00:00Z', duration: 'PT1H' },
        hourlyRate: null,
        costRate: null,
        customFieldValues: [],
    }));
}
describe('getTimeEntriesInRange', () => {
    it('stops after MAX_PAGES even when every page is full', async () => {
        const mockClient = {
            get: vi.fn().mockResolvedValue(makeFullPage()),
        };
        const service = new TimeEntryService(mockClient);
        const result = await service.getTimeEntriesInRange('ws1', 'user1', '2026-01-01T00:00:00Z', '2026-01-31T23:59:59Z');
        // MAX_PAGES = 10, each page has 1000 entries
        expect(result).toHaveLength(10000);
        expect(mockClient.get).toHaveBeenCalledTimes(10);
    });
    it('stops early when a page is not full', async () => {
        const mockClient = {
            get: vi.fn()
                .mockResolvedValueOnce(makeFullPage())
                .mockResolvedValueOnce(makeFullPage(500)),
        };
        const service = new TimeEntryService(mockClient);
        const result = await service.getTimeEntriesInRange('ws1', 'user1', '2026-01-01T00:00:00Z', '2026-01-07T23:59:59Z');
        expect(result).toHaveLength(1500);
        expect(mockClient.get).toHaveBeenCalledTimes(2);
    });
});
//# sourceMappingURL=timeEntryPagination.test.js.map
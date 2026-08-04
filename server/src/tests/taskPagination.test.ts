import { describe, it, expect, vi } from 'vitest';
import { TaskService } from '../api/services/task.service.js';
import type { ClockifyApiClient } from '../api/client.js';

function makeFullPage(pageSize = 50) {
  return Array.from({ length: pageSize }, (_, i) => ({ id: `task-${i}`, name: `Task ${i}` }));
}

describe('getAllTasks pagination cap', () => {
  it('stops after MAX_PAGES even when every page is full', async () => {
    const mockClient = {
      get: vi.fn().mockResolvedValue(makeFullPage()),
    } as unknown as ClockifyApiClient;

    const service = new TaskService(mockClient);
    const result = await service.getAllTasks('ws1', 'proj1');

    // MAX_PAGES = 10, each page has 50 tasks
    expect(result).toHaveLength(500);
    expect(mockClient.get).toHaveBeenCalledTimes(10);
  });

  it('stops early when a page is not full', async () => {
    const mockClient = {
      get: vi.fn()
        .mockResolvedValueOnce(makeFullPage())
        .mockResolvedValueOnce(makeFullPage(20)),
    } as unknown as ClockifyApiClient;

    const service = new TaskService(mockClient);
    const result = await service.getAllTasks('ws1', 'proj1');

    expect(result).toHaveLength(70);
    expect(mockClient.get).toHaveBeenCalledTimes(2);
  });
});

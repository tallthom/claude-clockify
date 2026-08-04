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

  it('honours a caller-supplied page-size instead of silently overwriting it with the default', async () => {
    const getMock = vi.fn().mockResolvedValue(makeFullPage(10));
    const service = new TaskService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllTasks('ws1', 'proj1', { 'page-size': 10 });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('page-size', 10);
  });

  it('uses the caller-supplied page-size as the break threshold, not the hardcoded 50', async () => {
    const getMock = vi.fn()
      .mockResolvedValueOnce(makeFullPage(10))
      .mockResolvedValueOnce(makeFullPage(5));
    const service = new TaskService({ get: getMock } as unknown as ClockifyApiClient);

    const result = await service.getAllTasks('ws1', 'proj1', { 'page-size': 10 });

    expect(result).toHaveLength(15);
    expect(getMock).toHaveBeenCalledTimes(2);
  });
});

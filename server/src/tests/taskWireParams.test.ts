import { describe, it, expect, vi } from 'vitest';
import { TaskService } from '../api/services/task.service.js';
import type { ClockifyApiClient } from '../api/client.js';

// Confirmed empirically against the real Clockify API: it silently ignores
// camelCase 'isActive'/'strictName' query params and only honours the
// kebab-case 'is-active'/'strict-name-search' equivalents.

describe('getAllTasks wire params', () => {
  it('translates strictName to the strict-name-search param Clockify expects', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new TaskService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllTasks('ws1', 'proj1', { name: 'MDL-891', strictName: true });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('strict-name-search', true);
    expect(params).not.toHaveProperty('strictName');
  });

  it('translates isActive to the is-active param Clockify expects', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new TaskService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllTasks('ws1', 'proj1', { isActive: false });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('is-active', false);
    expect(params).not.toHaveProperty('isActive');
  });

  it('passes name, page, and page-size through unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new TaskService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllTasks('ws1', 'proj1', { name: 'MDL-891', page: 1, 'page-size': 5 });

    const [, params] = getMock.mock.calls[0];
    expect(params).toMatchObject({ name: 'MDL-891', page: 1, 'page-size': 5 });
  });
});

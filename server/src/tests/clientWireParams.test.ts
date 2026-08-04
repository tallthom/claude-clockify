import { describe, it, expect, vi } from 'vitest';
import { ClientService } from '../api/services/client.service.js';
import type { ClockifyApiClient } from '../api/client.js';

// Same code shape as the confirmed sortColumn/sortOrder bug in
// project.service.ts and user.service.ts. Not independently confirmed live
// (this Clockify workspace has zero clients to sort against), fixed
// defensively for consistency with the two confirmed instances.

describe('getAllClients wire params', () => {
  it('translates sortColumn and sortOrder to sort-column and sort-order', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ClientService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllClients('ws1', { sortColumn: 'NAME', sortOrder: 'DESCENDING' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('sort-column', 'NAME');
    expect(params).toHaveProperty('sort-order', 'DESCENDING');
    expect(params).not.toHaveProperty('sortColumn');
    expect(params).not.toHaveProperty('sortOrder');
  });

  it('passes name, archived, page, and page-size through unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ClientService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllClients('ws1', {
      name: 'Acme',
      archived: false,
      page: 1,
      'page-size': 10,
    });

    const [, params] = getMock.mock.calls[0];
    expect(params).toMatchObject({ name: 'Acme', archived: false, page: 1, 'page-size': 10 });
  });
});

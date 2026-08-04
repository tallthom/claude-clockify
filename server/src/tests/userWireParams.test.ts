import { describe, it, expect, vi } from 'vitest';
import { UserService } from '../api/services/user.service.js';
import type { ClockifyApiClient } from '../api/client.js';

// Confirmed empirically against the real Clockify API: sortColumn/sortOrder
// are silently ignored and only the kebab-case equivalents work. includeRoles
// was also tested live and confirmed to already work correctly in camelCase —
// it must NOT be translated.

describe('getAllUsers wire params', () => {
  it('translates sortColumn and sortOrder to sort-column and sort-order', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new UserService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllUsers('ws1', { sortColumn: 'NAME', sortOrder: 'DESCENDING' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('sort-column', 'NAME');
    expect(params).toHaveProperty('sort-order', 'DESCENDING');
    expect(params).not.toHaveProperty('sortColumn');
    expect(params).not.toHaveProperty('sortOrder');
  });

  it('leaves includeRoles as camelCase, unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new UserService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllUsers('ws1', { includeRoles: true });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('includeRoles', true);
    expect(params).not.toHaveProperty('include-roles');
  });

  it('passes email, name, status, page, and page-size through unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new UserService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllUsers('ws1', {
      email: 'adrian@moodle.com',
      name: 'Adrian',
      status: 'ACTIVE',
      page: 1,
      'page-size': 10,
    });

    const [, params] = getMock.mock.calls[0];
    expect(params).toMatchObject({
      email: 'adrian@moodle.com',
      name: 'Adrian',
      status: 'ACTIVE',
      page: 1,
      'page-size': 10,
    });
  });
});

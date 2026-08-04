import { describe, it, expect, vi } from 'vitest';
import { ProjectService } from '../api/services/project.service.js';
import type { ClockifyApiClient } from '../api/client.js';

// Confirmed empirically against the real Clockify API: it silently ignores
// camelCase 'strictName'/'clientStatus'/'userStatus'/'isTemplate'/'sortColumn'/
// 'sortOrder' query params and only honours the kebab-case equivalents.

describe('getAllProjects wire params', () => {
  it('translates strictName to strict-name-search', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { name: 'Moodle', strictName: true });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('strict-name-search', true);
    expect(params).not.toHaveProperty('strictName');
  });

  it('translates clientStatus to client-status', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { clientStatus: 'ARCHIVED' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('client-status', 'ARCHIVED');
    expect(params).not.toHaveProperty('clientStatus');
  });

  it('translates userStatus to user-status', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { userStatus: 'ACTIVE' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('user-status', 'ACTIVE');
    expect(params).not.toHaveProperty('userStatus');
  });

  it('translates isTemplate to is-template', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { isTemplate: true });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('is-template', true);
    expect(params).not.toHaveProperty('isTemplate');
  });

  it('translates sortColumn and sortOrder to sort-column and sort-order', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', { sortColumn: 'NAME', sortOrder: 'DESCENDING' });

    const [, params] = getMock.mock.calls[0];
    expect(params).toHaveProperty('sort-column', 'NAME');
    expect(params).toHaveProperty('sort-order', 'DESCENDING');
    expect(params).not.toHaveProperty('sortColumn');
    expect(params).not.toHaveProperty('sortOrder');
  });

  it('passes name, archived, page, and page-size through unchanged', async () => {
    const getMock = vi.fn().mockResolvedValue([]);
    const service = new ProjectService({ get: getMock } as unknown as ClockifyApiClient);

    await service.getAllProjects('ws1', {
      name: 'Moodle',
      archived: false,
      page: 2,
      'page-size': 10,
    });

    const [, params] = getMock.mock.calls[0];
    expect(params).toMatchObject({ name: 'Moodle', archived: false, page: 2, 'page-size': 10 });
  });
});

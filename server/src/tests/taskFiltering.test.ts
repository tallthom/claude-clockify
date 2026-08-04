import { describe, it, expect } from 'vitest';
import { ClockifyTools } from '../tools/index.js';
import { ConfigurationManager } from '../config/index.js';

const VALID_WORKSPACE = '507f1f77bcf86cd799439011';
const VALID_PROJECT = '507f1f77bcf86cd799439012';

function getListTasksTool() {
  const config = new ConfigurationManager({ apiKey: 'fake-key' });
  const tools = new ClockifyTools('fake-key', config);
  const tool = tools.getTools().find(t => t.name === 'list_tasks');
  if (!tool) throw new Error('list_tasks tool not found');
  return tool;
}

describe('list_tasks inputSchema (issue #28 regression)', () => {
  it('retains a name filter instead of silently stripping it', () => {
    const tool = getListTasksTool();
    const result = tool.inputSchema.safeParse({
      workspaceId: VALID_WORKSPACE,
      projectId: VALID_PROJECT,
      name: 'Onboarding',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).name).toBe('Onboarding');
    }
  });

  it('retains a strictName filter', () => {
    const tool = getListTasksTool();
    const result = tool.inputSchema.safeParse({
      workspaceId: VALID_WORKSPACE,
      projectId: VALID_PROJECT,
      name: 'Onboarding',
      strictName: true,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).strictName).toBe(true);
    }
  });

  it('retains page and page-size for manual pagination', () => {
    const tool = getListTasksTool();
    const result = tool.inputSchema.safeParse({
      workspaceId: VALID_WORKSPACE,
      projectId: VALID_PROJECT,
      page: 2,
      'page-size': 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).page).toBe(2);
      expect((result.data as any)['page-size']).toBe(50);
    }
  });
});

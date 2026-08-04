import { describe, it, expect, vi } from 'vitest';
import { ClockifyTools, applyMaxTools } from '../tools/index.js';
import { ConfigurationManager } from '../config/index.js';

// Assumes no MAX_TOOLS / ENABLED_TOOL_CATEGORIES / ENABLED_TOOLS / DISABLED_TOOLS
// env vars are set in the shell running the test suite, so schema defaults apply.
function buildToolsWithDefaults() {
  const config = new ConfigurationManager({ apiKey: 'fake-key' });
  return new ClockifyTools('fake-key', config);
}

describe('default tool filtering (issue #27 regression)', () => {
  it('does not silently drop tools when the registered count exceeds the old maxTools of 50', () => {
    const tools = buildToolsWithDefaults();
    const enabledNames = tools.getTools().map(t => t.name);
    const totalRegistered = tools.getAvailableToolNames().length;

    expect(enabledNames).toContain('get_today_entries');
    expect(enabledNames).toContain('get_week_entries');
    expect(enabledNames).toContain('get_month_entries');
    expect(enabledNames).toContain('remove_user_from_project');
    expect(enabledNames.length).toBe(totalRegistered);
  });
});

describe('applyMaxTools', () => {
  it('keeps everything and reports nothing dropped when under the limit', () => {
    const result = applyMaxTools([{ name: 'a' }, { name: 'b' }], 5);
    expect(result.kept.map(t => t.name)).toEqual(['a', 'b']);
    expect(result.dropped).toEqual([]);
  });

  it('slices to maxTools and names the dropped tools in order', () => {
    const tools = [{ name: 'a' }, { name: 'b' }, { name: 'c' }, { name: 'd' }];
    const result = applyMaxTools(tools, 2);
    expect(result.kept.map(t => t.name)).toEqual(['a', 'b']);
    expect(result.dropped).toEqual(['c', 'd']);
  });
});

describe('ClockifyTools warns when maxTools excludes registered tools', () => {
  it('logs the excluded tool names via console.warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const config = new ConfigurationManager({
      apiKey: 'fake-key',
      toolFiltering: { maxTools: 2, enabledCategories: ['user'] },
    });
    const tools = new ClockifyTools('fake-key', config);
    tools.getTools();

    expect(warnSpy).toHaveBeenCalled();
    const message = warnSpy.mock.calls.map(call => call[0]).join(' ');
    // 'user' category has 3 tools (get_current_user, list_users, get_user) by
    // priority; maxTools=2 keeps the first two and drops get_user.
    expect(message).toContain('get_user');

    warnSpy.mockRestore();
  });
});

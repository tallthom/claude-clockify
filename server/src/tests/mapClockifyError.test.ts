import { describe, it, expect, vi } from 'vitest';
import { ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { mapClockifyError } from '../errors/mapClockifyError.js';

describe('mapClockifyError', () => {
  it('passes an existing McpError-shaped object through unchanged', () => {
    const mcpError = { code: ErrorCode.InvalidParams, message: 'Invalid arguments: projectId: Required' };

    const result = mapClockifyError(mcpError);

    expect(result).toBe(mcpError);
  });

  it('maps an invalid API key error to InvalidRequest with a config-pointing message', () => {
    const result = mapClockifyError(new Error('Invalid API key or unauthorized access'));

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain('CLOCKIFY_API_KEY');
  });

  it('maps a rate limit error to InvalidRequest with a retry message', () => {
    const result = mapClockifyError(new Error('Rate limit exceeded. Please try again later'));

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain('rate limit');
  });

  it('maps a not-found error to InvalidRequest, preserving the original message', () => {
    const result = mapClockifyError(new Error('Resource not found'));

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain('Resource not found');
  });

  it('maps a restriction-middleware error to InvalidRequest, preserving the original message', () => {
    const result = mapClockifyError(new Error('Access to project abc123 is restricted'));

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain('Access to project abc123 is restricted');
  });

  it('maps a Forbidden/403 error to InvalidRequest with a plan/permission explanation, not the generic fallback', () => {
    const result = mapClockifyError(
      new Error("Forbidden: You don't have permission to perform this action")
    );

    expect(result.code).toBe(ErrorCode.InvalidRequest);
    expect(result.message).toContain("Forbidden: You don't have permission to perform this action");
    expect(result.message).toContain('plan');
    expect(result.message).not.toContain('Tool execution failed');
  });

  it('falls back to a generic InternalError for anything unrecognised, without leaking the raw message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = mapClockifyError(new Error('ECONNRESET: socket hang up'));

    expect(result.code).toBe(ErrorCode.InternalError);
    expect(result.message).toContain('Tool execution failed. Check server logs for details.');
    expect(spy).toHaveBeenCalledWith('Unexpected error:', 'ECONNRESET: socket hang up');

    spy.mockRestore();
  });
});

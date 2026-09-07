import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

/**
 * Maps an error thrown from a tool handler to an McpError safe to throw
 * back to the client. Existing McpError-shaped objects pass through as-is
 * (duck-typed, not instanceof, to survive module dedup issues inside .mcpb
 * bundles where the SDK may load twice).
 */
export function mapClockifyError(error: unknown): McpError {
  const err = error as { code?: unknown; message?: unknown };

  if (err?.code !== undefined && err?.message !== undefined && typeof err.code === 'number') {
    return error as McpError;
  }

  const message = error instanceof Error ? error.message : String(error);

  if (message.includes('Invalid API key') || message.includes('unauthorized')) {
    return new McpError(
      ErrorCode.InvalidRequest,
      'Invalid Clockify API key. Please check your CLOCKIFY_API_KEY environment variable.'
    );
  } else if (message.includes('Rate limit') || message.includes('429')) {
    return new McpError(
      ErrorCode.InvalidRequest,
      'Clockify API rate limit exceeded. Please try again later.'
    );
  } else if (message.includes('not found') || message.includes('404')) {
    return new McpError(ErrorCode.InvalidRequest, `Resource not found: ${message}`);
  } else if (message.includes('restricted') || message.includes('not allowed')) {
    return new McpError(ErrorCode.InvalidRequest, message);
  } else if (message.includes('Forbidden') || message.includes('403')) {
    return new McpError(
      ErrorCode.InvalidRequest,
      `${message}. This usually means the resource isn't available on your Clockify plan, or your API key's role lacks permission for it, not an issue with the MCP server itself.`
    );
  } else {
    console.error('Unexpected error:', message);
    return new McpError(ErrorCode.InternalError, 'Tool execution failed. Check server logs for details.');
  }
}

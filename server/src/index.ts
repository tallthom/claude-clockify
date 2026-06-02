#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ErrorCode,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ClockifyTools } from './tools/index.js';
import { ConfigurationManager } from './config/index.js';

// Initialize configuration
const config = new ConfigurationManager();

const server = new Server(
  {
    name: 'clockify-mcp-server',
    version: '1.0.0',
    description: 'Comprehensive Clockify time tracking integration with configurable restrictions',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  }
);

const clockifyTools = new ClockifyTools(config.getApiKey(), config);
const tools = clockifyTools.getTools();
const restrictionMiddleware = clockifyTools.getRestrictionMiddleware();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: tools.map((tool: any) => ({
      name: tool.name,
      description: tool.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      inputSchema: zodToJsonSchema(tool.inputSchema as any),
    })),
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  const tool = tools.find(t => t.name === request.params.name);

  if (!tool) {
    throw new McpError(ErrorCode.MethodNotFound, `Tool "${request.params.name}" not found`);
  }

  try {
    const args = request.params.arguments || {};

    // Apply middleware restrictions and defaults (async — resolves workspace ID if needed)
    const processedArgs = await restrictionMiddleware.applyDefaults(args);
    restrictionMiddleware.validateToolAccess(request.params.name, processedArgs);

    const result = await tool.handler(processedArgs);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error: any) {
    // Re-throw MCP errors as-is
    if (error instanceof McpError) {
      throw error;
    }

    if (error.message.includes('Invalid API key') || error.message.includes('unauthorized')) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Invalid Clockify API key. Please check your CLOCKIFY_API_KEY environment variable.'
      );
    } else if (error.message.includes('Rate limit') || error.message.includes('429')) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Clockify API rate limit exceeded. Please try again later.'
      );
    } else if (error.message.includes('not found') || error.message.includes('404')) {
      throw new McpError(ErrorCode.InvalidRequest, `Resource not found: ${error.message}`);
    } else if (error.message.includes('restricted') || error.message.includes('not allowed')) {
      throw new McpError(ErrorCode.InvalidRequest, error.message);
    } else {
      console.error('Unexpected error:', error instanceof Error ? error.message : String(error));
      throw new McpError(ErrorCode.InternalError, 'Tool execution failed. Check server logs for details.');
    }
  }
});

// List available resources
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'clockify://workspaces',
        name: 'Workspaces',
        description: 'List of all accessible workspaces',
        mimeType: 'application/json',
      },
      {
        uri: 'clockify://current-user',
        name: 'Current User',
        description: 'Information about the authenticated user',
        mimeType: 'application/json',
      },
    ],
  };
});

// Read resources
server.setRequestHandler(ReadResourceRequestSchema, async request => {
  const uri = request.params.uri;

  try {
    if (uri === 'clockify://workspaces') {
      const tool = tools.find(t => t.name === 'list_workspaces');
      if (tool) {
        const result = await tool.handler({});
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    } else if (uri === 'clockify://current-user') {
      const tool = tools.find(t => t.name === 'get_current_user');
      if (tool) {
        const result = await tool.handler({});
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }
    }

    throw new McpError(ErrorCode.InvalidRequest, `Unknown resource: ${uri}`);
  } catch (error: any) {
    throw new McpError(ErrorCode.InternalError, `Failed to read resource: ${error.message}`);
  }
});

// List available prompts
server.setRequestHandler(ListPromptsRequestSchema, async () => {
  return {
    prompts: [
      {
        name: 'track_time',
        description: 'Start tracking time for a task',
        arguments: [
          {
            name: 'description',
            description: 'What are you working on?',
            required: true,
          },
          {
            name: 'project',
            description: 'Project name (optional)',
            required: false,
          },
        ],
      },
      {
        name: 'daily_summary',
        description: "Get a summary of today's time entries",
        arguments: [],
      },
      {
        name: 'weekly_report',
        description: 'Generate a weekly time report',
        arguments: [
          {
            name: 'format',
            description: 'Report format (text, json, csv)',
            required: false,
          },
        ],
      },
    ],
  };
});

// Get prompt
server.setRequestHandler(GetPromptRequestSchema, async request => {
  const promptName = request.params.name;
  const args = request.params.arguments || {};

  switch (promptName) {
    case 'track_time':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Start tracking time. Description: ${JSON.stringify(String(args.description ?? ''))}${
                args.project ? `. Project: ${JSON.stringify(String(args.project))}` : ''
              }. First, get the current user and their active workspace, then find the project if specified, and create a time entry.`,
            },
          },
        ],
      };

    case 'daily_summary':
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: "Get today's time entries for the current user. First get the current user and their active workspace, then fetch today's entries and provide a summary including total time worked, projects worked on, and individual entry details.",
            },
          },
        ],
      };

    case 'weekly_report': {
      const format = args.format || 'text';
      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Generate a weekly time report in ${format} format. Get the current user and workspace, then fetch this week's time entries. Provide a summary grouped by project and day, showing total hours worked and key activities.`,
            },
          },
        ],
      };
    }

    default:
      throw new McpError(ErrorCode.InvalidRequest, `Unknown prompt: ${promptName}`);
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Clockify MCP server started successfully');

  const restrictions = config.getRestrictions();
  if (restrictions.readOnly) {
    console.error('Running in READ-ONLY mode');
  }
}

main().catch(error => {
  console.error('Fatal error starting server:', error);
  process.exit(1);
});

import { z } from 'zod';

export const ConfigSchema = z.object({
  apiKey: z.string().min(1, 'API key is required'),
  apiUrl: z
    .string()
    .url()
    .refine(u => u.startsWith('https://'), { message: 'API URL must use HTTPS' })
    .default('https://api.clockify.me/api/v1'),
  region: z.enum(['global', 'eu', 'us']).default('global').describe('Clockify API region'),
  restrictions: z
    .object({
      // Project restrictions
      allowedProjects: z
        .array(z.string())
        .optional()
        .describe(
          'List of allowed project IDs. If set, only these projects can be accessed/modified'
        ),
      deniedProjects: z
        .array(z.string())
        .optional()
        .describe('List of denied project IDs. These projects cannot be accessed/modified'),
      defaultProjectId: z
        .string()
        .optional()
        .describe('Default project ID to use when not specified'),

      // Workspace restrictions
      allowedWorkspaces: z.array(z.string()).optional().describe('List of allowed workspace IDs'),
      defaultWorkspaceId: z
        .string()
        .optional()
        .describe('Default workspace ID to use when not specified'),

      // Operation restrictions
      readOnly: z.boolean().default(false).describe('If true, only read operations are allowed'),
      allowTimeEntryCreation: z.boolean().default(true).describe('Allow creating new time entries'),
      allowTimeEntryDeletion: z.boolean().default(true).describe('Allow deleting time entries'),
      allowProjectManagement: z
        .boolean()
        .default(true)
        .describe('Allow creating/updating/deleting projects'),
      allowClientManagement: z.boolean().default(true).describe('Allow managing clients'),
      allowUserManagement: z.boolean().default(false).describe('Allow managing users'),
      allowWorkspaceDeletion: z.boolean().default(false).describe('Allow deleting workspaces'),

    })
    .default(() => ({
      readOnly: false,
      allowTimeEntryCreation: true,
      allowTimeEntryDeletion: true,
      allowProjectManagement: true,
      allowClientManagement: true,
      allowUserManagement: false,
      allowWorkspaceDeletion: false,
    })),

  // Caching
  cacheEnabled: z.boolean().default(true).describe('Enable caching for API responses'),
  cacheTTLSeconds: z.number().default(300).describe('Cache TTL in seconds'),

  // Rate limiting
  rateLimitPerMinute: z.number().default(50).describe('Max API calls per minute'),

  // Timezone for displaying timestamps
  timezone: z.string().default('UTC').describe('IANA timezone for displaying timestamps (e.g. Asia/Tokyo, Europe/Athens)'),

  // Logging
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Tool Visibility
  toolFiltering: z
    .object({
      enabledCategories: z
        .array(
          z.enum([
            'user',
            'workspace',
            'project',
            'client',
            'timeEntry',
            'tag',
            'task',
            'report',
            'bulk',
            'search',
            'customField',
          ])
        )
        .default(['user', 'workspace', 'project', 'client', 'timeEntry', 'tag', 'task', 'report', 'bulk', 'search', 'customField'])
        .describe('Categories of tools to enable'),
      enabledTools: z
        .array(z.string())
        .optional()
        .describe('Specific tools to enable (overrides categories)'),
      disabledTools: z.array(z.string()).optional().describe('Specific tools to disable'),
      maxTools: z.number().default(50).describe('Maximum number of tools to expose'),
    })
    .default(() => ({
      enabledCategories: ['user', 'workspace', 'project', 'client', 'timeEntry', 'tag', 'task', 'report', 'bulk', 'search', 'customField'] as (
        | 'user'
        | 'workspace'
        | 'project'
        | 'client'
        | 'timeEntry'
        | 'tag'
        | 'task'
        | 'report'
        | 'bulk'
        | 'search'
        | 'customField'
      )[],
      maxTools: 50,
    })),
});

export type Config = z.infer<typeof ConfigSchema>;

export class ConfigurationManager {
  private config: Config;

  constructor(overrides?: Partial<Config>) {
    const systemTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const envConfig = {
      apiKey: process.env.CLOCKIFY_API_KEY || '',
      apiUrl: process.env.CLOCKIFY_API_URL,
      region: process.env.CLOCKIFY_REGION as 'global' | 'eu' | 'us',
      timezone: process.env.CLOCKIFY_TIMEZONE || systemTimezone,
      restrictions: this.parseRestrictions(),
      toolFiltering: this.parseToolFiltering(),
      cacheEnabled: process.env.CACHE_ENABLED !== undefined ? process.env.CACHE_ENABLED === 'true' : undefined,
      cacheTTLSeconds: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : undefined,
      rateLimitPerMinute: process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : undefined,
      logLevel: process.env.LOG_LEVEL as any,
    };

    // Remove undefined values
    const cleanConfig = Object.fromEntries(
      Object.entries(envConfig).filter(([_, v]) => v !== undefined)
    );

    // Merge with overrides
    const finalConfig = { ...cleanConfig, ...overrides };

    // Validate
    const result = ConfigSchema.safeParse(finalConfig);
    if (!result.success) {
      throw new Error(`Configuration validation failed: ${result.error.message}`);
    }

    this.config = result.data;

    this.warnUnimplementedSettings();
  }

  private warnUnimplementedSettings(): void {
    const unimplemented: string[] = [];
    if (process.env.RATE_LIMIT) unimplemented.push('RATE_LIMIT');
    if (process.env.CACHE_ENABLED) unimplemented.push('CACHE_ENABLED');
    if (process.env.CACHE_TTL) unimplemented.push('CACHE_TTL');
    if (process.env.LOG_LEVEL) unimplemented.push('LOG_LEVEL');
    if (unimplemented.length > 0) {
      console.warn(
        `[clockify-mcp] Warning: ${unimplemented.join(', ')} ${unimplemented.length === 1 ? 'is' : 'are'} set but not yet enforced.`
      );
    }
  }

  private parseToolFiltering(): Config['toolFiltering'] {
    const toolFiltering: any = {};

    // Parse enabled categories
    if (process.env.ENABLED_TOOL_CATEGORIES) {
      toolFiltering.enabledCategories = process.env.ENABLED_TOOL_CATEGORIES.split(',').map(s =>
        s.trim()
      );
    }

    // Parse enabled tools
    if (process.env.ENABLED_TOOLS) {
      toolFiltering.enabledTools = process.env.ENABLED_TOOLS.split(',').map(s => s.trim());
    }

    // Parse disabled tools
    if (process.env.DISABLED_TOOLS) {
      toolFiltering.disabledTools = process.env.DISABLED_TOOLS.split(',').map(s => s.trim());
    }

    // Parse max tools
    if (process.env.MAX_TOOLS) {
      toolFiltering.maxTools = parseInt(process.env.MAX_TOOLS);
    }

    return toolFiltering;
  }

  private parseRestrictions(): Config['restrictions'] {
    const restrictions: any = {};

    // Parse project restrictions
    if (process.env.ALLOWED_PROJECTS) {
      restrictions.allowedProjects = process.env.ALLOWED_PROJECTS.split(',').map(s => s.trim());
    }
    if (process.env.DENIED_PROJECTS) {
      restrictions.deniedProjects = process.env.DENIED_PROJECTS.split(',').map(s => s.trim());
    }
    if (process.env.DEFAULT_PROJECT_ID) {
      restrictions.defaultProjectId = process.env.DEFAULT_PROJECT_ID;
    }

    // Parse workspace restrictions
    if (process.env.ALLOWED_WORKSPACES) {
      restrictions.allowedWorkspaces = process.env.ALLOWED_WORKSPACES.split(',').map(s => s.trim());
    }
    if (process.env.DEFAULT_WORKSPACE_ID) {
      restrictions.defaultWorkspaceId = process.env.DEFAULT_WORKSPACE_ID;
    }

    // Parse operation restrictions
    if (process.env.READ_ONLY) {
      restrictions.readOnly = process.env.READ_ONLY === 'true';
    }
    if (process.env.ALLOW_TIME_ENTRY_CREATION) {
      restrictions.allowTimeEntryCreation = process.env.ALLOW_TIME_ENTRY_CREATION === 'true';
    }
    if (process.env.ALLOW_TIME_ENTRY_DELETION) {
      restrictions.allowTimeEntryDeletion = process.env.ALLOW_TIME_ENTRY_DELETION === 'true';
    }
    if (process.env.ALLOW_PROJECT_MANAGEMENT) {
      restrictions.allowProjectManagement = process.env.ALLOW_PROJECT_MANAGEMENT === 'true';
    }
    if (process.env.ALLOW_CLIENT_MANAGEMENT) {
      restrictions.allowClientManagement = process.env.ALLOW_CLIENT_MANAGEMENT === 'true';
    }
    if (process.env.ALLOW_USER_MANAGEMENT) {
      restrictions.allowUserManagement = process.env.ALLOW_USER_MANAGEMENT === 'true';
    }
    if (process.env.ALLOW_WORKSPACE_DELETION) {
      restrictions.allowWorkspaceDeletion = process.env.ALLOW_WORKSPACE_DELETION === 'true';
    }

    return restrictions;
  }

  get(): Config {
    return this.config;
  }

  getApiKey(): string {
    return this.config.apiKey;
  }

  getApiUrl(): string {
    // If apiUrl is explicitly set, use it
    if (this.config.apiUrl !== 'https://api.clockify.me/api/v1') {
      return this.config.apiUrl;
    }

    // Otherwise, use region-specific URL
    const regionUrls = {
      global: 'https://api.clockify.me/api/v1',
      eu: 'https://euc1-api.clockify.me/api/v1',
      us: 'https://use2-api.clockify.me/api/v1',
    };

    return regionUrls[this.config.region] || regionUrls.global;
  }

  getRestrictions(): Config['restrictions'] {
    return this.config.restrictions;
  }

  getToolFiltering(): Config['toolFiltering'] {
    return this.config.toolFiltering;
  }

  isProjectAllowed(projectId: string): boolean {
    const restrictions = this.config.restrictions;

    // Check denied list first
    if (restrictions.deniedProjects?.includes(projectId)) {
      return false;
    }

    // If allowed list is defined, project must be in it
    if (restrictions.allowedProjects && restrictions.allowedProjects.length > 0) {
      return restrictions.allowedProjects.includes(projectId);
    }

    // No restrictions
    return true;
  }

  isWorkspaceAllowed(workspaceId: string): boolean {
    const restrictions = this.config.restrictions;

    // If allowed list is defined, workspace must be in it
    if (restrictions.allowedWorkspaces && restrictions.allowedWorkspaces.length > 0) {
      return restrictions.allowedWorkspaces.includes(workspaceId);
    }

    // No restrictions
    return true;
  }

  canPerformOperation(operation: string): boolean {
    const restrictions = this.config.restrictions;

    if (restrictions.readOnly && operation !== 'read') {
      return false;
    }

    switch (operation) {
      case 'createTimeEntry':
        return restrictions.allowTimeEntryCreation;
      case 'deleteTimeEntry':
        return restrictions.allowTimeEntryDeletion;
      case 'manageProject':
        return restrictions.allowProjectManagement;
      case 'manageClient':
        return restrictions.allowClientManagement;
      case 'manageUser':
        return restrictions.allowUserManagement;
      case 'deleteWorkspace':
        return restrictions.allowWorkspaceDeletion ?? false;
      default:
        return true;
    }
  }

  getTimezone(): string {
    return this.config.timezone;
  }

  getDefaultProjectId(): string | undefined {
    return this.config.restrictions.defaultProjectId;
  }

  getDefaultWorkspaceId(): string | undefined {
    return this.config.restrictions.defaultWorkspaceId;
  }

}

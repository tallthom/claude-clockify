import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
export const ConfigSchema = z.object({
    apiKey: z.string().min(1, 'API key is required'),
    apiUrl: z.string().url().default('https://api.clockify.me/api/v1'),
    region: z.enum(['global', 'eu', 'us']).default('global').describe('Clockify API region'),
    restrictions: z
        .object({
        // Project restrictions
        allowedProjects: z
            .array(z.string())
            .optional()
            .describe('List of allowed project IDs. If set, only these projects can be accessed/modified'),
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
        // Time restrictions
        maxTimeEntryDuration: z
            .number()
            .optional()
            .describe('Maximum duration for a single time entry in hours'),
        allowFutureTimeEntries: z
            .boolean()
            .default(false)
            .describe('Allow creating time entries in the future'),
        allowPastTimeEntriesInDays: z
            .number()
            .default(30)
            .describe('How many days in the past time entries can be created/edited'),
    })
        .default(() => ({
        readOnly: false,
        allowTimeEntryCreation: true,
        allowTimeEntryDeletion: true,
        allowProjectManagement: true,
        allowClientManagement: true,
        allowUserManagement: false,
        allowFutureTimeEntries: false,
        allowPastTimeEntriesInDays: 30,
    })),
    // Caching
    cacheEnabled: z.boolean().default(true).describe('Enable caching for API responses'),
    cacheTTLSeconds: z.number().default(300).describe('Cache TTL in seconds'),
    // Rate limiting
    rateLimitPerMinute: z.number().default(50).describe('Max API calls per minute'),
    // Logging
    logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    // Tool Visibility
    toolFiltering: z
        .object({
        enabledCategories: z
            .array(z.enum([
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
        ]))
            .default(['user', 'workspace', 'project', 'client', 'timeEntry', 'tag', 'task', 'report', 'bulk', 'search'])
            .describe('Categories of tools to enable'),
        enabledTools: z
            .array(z.string())
            .optional()
            .describe('Specific tools to enable (overrides categories)'),
        disabledTools: z.array(z.string()).optional().describe('Specific tools to disable'),
        maxTools: z.number().default(50).describe('Maximum number of tools to expose'),
    })
        .default(() => ({
        enabledCategories: ['user', 'workspace', 'project', 'client', 'timeEntry', 'tag', 'task', 'report', 'bulk', 'search'],
        maxTools: 50,
    })),
});
export class ConfigurationManager {
    config;
    constructor(overrides) {
        const envConfig = {
            apiKey: process.env.CLOCKIFY_API_KEY || '',
            apiUrl: process.env.CLOCKIFY_API_URL,
            region: process.env.CLOCKIFY_REGION,
            restrictions: this.parseRestrictions(),
            toolFiltering: this.parseToolFiltering(),
            cacheEnabled: process.env.CACHE_ENABLED === 'true',
            cacheTTLSeconds: process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL) : undefined,
            rateLimitPerMinute: process.env.RATE_LIMIT ? parseInt(process.env.RATE_LIMIT) : undefined,
            logLevel: process.env.LOG_LEVEL,
        };
        // Remove undefined values
        const cleanConfig = Object.fromEntries(Object.entries(envConfig).filter(([_, v]) => v !== undefined));
        // Merge with overrides
        const finalConfig = { ...cleanConfig, ...overrides };
        // Validate
        const result = ConfigSchema.safeParse(finalConfig);
        if (!result.success) {
            throw new Error(`Configuration validation failed: ${result.error.message}`);
        }
        this.config = result.data;
    }
    parseToolFiltering() {
        const toolFiltering = {};
        // Parse enabled categories
        if (process.env.ENABLED_TOOL_CATEGORIES) {
            toolFiltering.enabledCategories = process.env.ENABLED_TOOL_CATEGORIES.split(',').map(s => s.trim());
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
    parseRestrictions() {
        const restrictions = {};
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
        if (process.env.ALLOW_TIME_ENTRY_CREATION !== undefined) {
            restrictions.allowTimeEntryCreation = process.env.ALLOW_TIME_ENTRY_CREATION === 'true';
        }
        if (process.env.ALLOW_TIME_ENTRY_DELETION !== undefined) {
            restrictions.allowTimeEntryDeletion = process.env.ALLOW_TIME_ENTRY_DELETION === 'true';
        }
        if (process.env.ALLOW_PROJECT_MANAGEMENT !== undefined) {
            restrictions.allowProjectManagement = process.env.ALLOW_PROJECT_MANAGEMENT === 'true';
        }
        if (process.env.ALLOW_CLIENT_MANAGEMENT !== undefined) {
            restrictions.allowClientManagement = process.env.ALLOW_CLIENT_MANAGEMENT === 'true';
        }
        if (process.env.ALLOW_USER_MANAGEMENT !== undefined) {
            restrictions.allowUserManagement = process.env.ALLOW_USER_MANAGEMENT === 'true';
        }
        // Parse time restrictions
        if (process.env.MAX_TIME_ENTRY_DURATION) {
            restrictions.maxTimeEntryDuration = parseFloat(process.env.MAX_TIME_ENTRY_DURATION);
        }
        if (process.env.ALLOW_FUTURE_TIME_ENTRIES !== undefined) {
            restrictions.allowFutureTimeEntries = process.env.ALLOW_FUTURE_TIME_ENTRIES === 'true';
        }
        if (process.env.ALLOW_PAST_TIME_ENTRIES_IN_DAYS) {
            restrictions.allowPastTimeEntriesInDays = parseInt(process.env.ALLOW_PAST_TIME_ENTRIES_IN_DAYS);
        }
        return restrictions;
    }
    get() {
        return this.config;
    }
    getApiKey() {
        return this.config.apiKey;
    }
    getApiUrl() {
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
    getRestrictions() {
        return this.config.restrictions;
    }
    getToolFiltering() {
        return this.config.toolFiltering;
    }
    isProjectAllowed(projectId) {
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
    isWorkspaceAllowed(workspaceId) {
        const restrictions = this.config.restrictions;
        // If allowed list is defined, workspace must be in it
        if (restrictions.allowedWorkspaces && restrictions.allowedWorkspaces.length > 0) {
            return restrictions.allowedWorkspaces.includes(workspaceId);
        }
        // No restrictions
        return true;
    }
    canPerformOperation(operation) {
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
            default:
                return true;
        }
    }
    getDefaultProjectId() {
        return this.config.restrictions.defaultProjectId;
    }
    getDefaultWorkspaceId() {
        return this.config.restrictions.defaultWorkspaceId;
    }
    validateTimeEntry(start, end) {
        const restrictions = this.config.restrictions;
        // Check future entries
        if (!restrictions.allowFutureTimeEntries && start > new Date()) {
            return { valid: false, error: 'Future time entries are not allowed' };
        }
        // Check past entries
        const maxPastDate = new Date();
        maxPastDate.setDate(maxPastDate.getDate() - restrictions.allowPastTimeEntriesInDays);
        if (start < maxPastDate) {
            return {
                valid: false,
                error: `Time entries older than ${restrictions.allowPastTimeEntriesInDays} days are not allowed`,
            };
        }
        // Check duration
        if (end && restrictions.maxTimeEntryDuration) {
            const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            if (durationHours > restrictions.maxTimeEntryDuration) {
                return {
                    valid: false,
                    error: `Time entry duration exceeds maximum of ${restrictions.maxTimeEntryDuration} hours`,
                };
            }
        }
        return { valid: true };
    }
}
// Export singleton instance
export const config = new ConfigurationManager();
//# sourceMappingURL=index.js.map
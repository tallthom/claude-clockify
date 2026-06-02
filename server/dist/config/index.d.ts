import { z } from 'zod';
export declare const ConfigSchema: z.ZodObject<{
    apiKey: z.ZodString;
    apiUrl: z.ZodDefault<z.ZodEffects<z.ZodString, string, string>>;
    region: z.ZodDefault<z.ZodEnum<["global", "eu", "us"]>>;
    restrictions: z.ZodDefault<z.ZodObject<{
        allowedProjects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        deniedProjects: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        defaultProjectId: z.ZodOptional<z.ZodString>;
        allowedWorkspaces: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        defaultWorkspaceId: z.ZodOptional<z.ZodString>;
        readOnly: z.ZodDefault<z.ZodBoolean>;
        allowTimeEntryCreation: z.ZodDefault<z.ZodBoolean>;
        allowTimeEntryDeletion: z.ZodDefault<z.ZodBoolean>;
        allowProjectManagement: z.ZodDefault<z.ZodBoolean>;
        allowClientManagement: z.ZodDefault<z.ZodBoolean>;
        allowUserManagement: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        readOnly: boolean;
        allowTimeEntryCreation: boolean;
        allowTimeEntryDeletion: boolean;
        allowProjectManagement: boolean;
        allowClientManagement: boolean;
        allowUserManagement: boolean;
        allowedProjects?: string[] | undefined;
        deniedProjects?: string[] | undefined;
        defaultProjectId?: string | undefined;
        allowedWorkspaces?: string[] | undefined;
        defaultWorkspaceId?: string | undefined;
    }, {
        allowedProjects?: string[] | undefined;
        deniedProjects?: string[] | undefined;
        defaultProjectId?: string | undefined;
        allowedWorkspaces?: string[] | undefined;
        defaultWorkspaceId?: string | undefined;
        readOnly?: boolean | undefined;
        allowTimeEntryCreation?: boolean | undefined;
        allowTimeEntryDeletion?: boolean | undefined;
        allowProjectManagement?: boolean | undefined;
        allowClientManagement?: boolean | undefined;
        allowUserManagement?: boolean | undefined;
    }>>;
    cacheEnabled: z.ZodDefault<z.ZodBoolean>;
    cacheTTLSeconds: z.ZodDefault<z.ZodNumber>;
    rateLimitPerMinute: z.ZodDefault<z.ZodNumber>;
    timezone: z.ZodDefault<z.ZodString>;
    logLevel: z.ZodDefault<z.ZodEnum<["debug", "info", "warn", "error"]>>;
    toolFiltering: z.ZodDefault<z.ZodObject<{
        enabledCategories: z.ZodDefault<z.ZodArray<z.ZodEnum<["user", "workspace", "project", "client", "timeEntry", "tag", "task", "report", "bulk", "search"]>, "many">>;
        enabledTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        disabledTools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        maxTools: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        enabledCategories: ("user" | "workspace" | "project" | "client" | "timeEntry" | "tag" | "task" | "report" | "bulk" | "search")[];
        maxTools: number;
        enabledTools?: string[] | undefined;
        disabledTools?: string[] | undefined;
    }, {
        enabledCategories?: ("user" | "workspace" | "project" | "client" | "timeEntry" | "tag" | "task" | "report" | "bulk" | "search")[] | undefined;
        enabledTools?: string[] | undefined;
        disabledTools?: string[] | undefined;
        maxTools?: number | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
    apiUrl: string;
    region: "global" | "eu" | "us";
    restrictions: {
        readOnly: boolean;
        allowTimeEntryCreation: boolean;
        allowTimeEntryDeletion: boolean;
        allowProjectManagement: boolean;
        allowClientManagement: boolean;
        allowUserManagement: boolean;
        allowedProjects?: string[] | undefined;
        deniedProjects?: string[] | undefined;
        defaultProjectId?: string | undefined;
        allowedWorkspaces?: string[] | undefined;
        defaultWorkspaceId?: string | undefined;
    };
    cacheEnabled: boolean;
    cacheTTLSeconds: number;
    rateLimitPerMinute: number;
    timezone: string;
    logLevel: "debug" | "info" | "warn" | "error";
    toolFiltering: {
        enabledCategories: ("user" | "workspace" | "project" | "client" | "timeEntry" | "tag" | "task" | "report" | "bulk" | "search")[];
        maxTools: number;
        enabledTools?: string[] | undefined;
        disabledTools?: string[] | undefined;
    };
}, {
    apiKey: string;
    apiUrl?: string | undefined;
    region?: "global" | "eu" | "us" | undefined;
    restrictions?: {
        allowedProjects?: string[] | undefined;
        deniedProjects?: string[] | undefined;
        defaultProjectId?: string | undefined;
        allowedWorkspaces?: string[] | undefined;
        defaultWorkspaceId?: string | undefined;
        readOnly?: boolean | undefined;
        allowTimeEntryCreation?: boolean | undefined;
        allowTimeEntryDeletion?: boolean | undefined;
        allowProjectManagement?: boolean | undefined;
        allowClientManagement?: boolean | undefined;
        allowUserManagement?: boolean | undefined;
    } | undefined;
    cacheEnabled?: boolean | undefined;
    cacheTTLSeconds?: number | undefined;
    rateLimitPerMinute?: number | undefined;
    timezone?: string | undefined;
    logLevel?: "debug" | "info" | "warn" | "error" | undefined;
    toolFiltering?: {
        enabledCategories?: ("user" | "workspace" | "project" | "client" | "timeEntry" | "tag" | "task" | "report" | "bulk" | "search")[] | undefined;
        enabledTools?: string[] | undefined;
        disabledTools?: string[] | undefined;
        maxTools?: number | undefined;
    } | undefined;
}>;
export type Config = z.infer<typeof ConfigSchema>;
export declare class ConfigurationManager {
    private config;
    constructor(overrides?: Partial<Config>);
    private parseToolFiltering;
    private parseRestrictions;
    get(): Config;
    getApiKey(): string;
    getApiUrl(): string;
    getRestrictions(): Config['restrictions'];
    getToolFiltering(): Config['toolFiltering'];
    isProjectAllowed(projectId: string): boolean;
    isWorkspaceAllowed(workspaceId: string): boolean;
    canPerformOperation(operation: string): boolean;
    getTimezone(): string;
    getDefaultProjectId(): string | undefined;
    getDefaultWorkspaceId(): string | undefined;
}
export declare const config: ConfigurationManager;
//# sourceMappingURL=index.d.ts.map
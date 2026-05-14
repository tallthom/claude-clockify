import { z } from 'zod';
import { ConfigurationManager } from '../config/index.js';
export declare class ClockifyTools {
    private userService;
    private workspaceService;
    private projectService;
    private clientService;
    private timeEntryService;
    private tagService;
    private taskService;
    private reportService;
    private customFieldService;
    private restrictionMiddleware;
    private config;
    constructor(apiKey: string, config: ConfigurationManager);
    private isProtectedProject;
    private isConfiguredProject;
    private getAllTools;
    private filterTools;
    getTools(): {
        name: string;
        description: string;
        inputSchema: z.ZodType<any, z.ZodTypeDef, any>;
        handler: (args: any) => Promise<any>;
    }[];
    getToolCategories(): string[];
    getAvailableToolNames(): string[];
    getToolsByCategory(category: string): string[];
}
//# sourceMappingURL=index.d.ts.map
import { z } from 'zod';

function formatLocalTime(iso: string | null | undefined, timezone: string): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  }).formatToParts(date);
  const get = (type: string) => parts.find(p => p.type === type)?.value ?? '';
  const tz = new Intl.DateTimeFormat('en-US', { timeZone: timezone, timeZoneName: 'short' })
    .formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? timezone;
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} ${tz}`;
}
import {
  ClockifyApiClient,
  UserService,
  WorkspaceService,
  ProjectService,
  ClientService,
  TimeEntryService,
  TagService,
  TaskService,
  ReportService,
  CustomFieldService,
} from '../api/services/index.js';
import * as schemas from './schemas.js';
import { ConfigurationManager } from '../config/index.js';
import { RestrictionMiddleware } from '../middleware/restrictions.js';

interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  inputSchema: z.ZodSchema;
  handler: (args: any) => Promise<any>;
  priority?: number; // Lower number = higher priority when filtering
}

export class ClockifyTools {
  private userService: UserService;
  private workspaceService: WorkspaceService;
  private projectService: ProjectService;
  private clientService: ClientService;
  private timeEntryService: TimeEntryService;
  private tagService: TagService;
  private taskService: TaskService;
  private reportService: ReportService;
  private customFieldService: CustomFieldService;
  private restrictionMiddleware: RestrictionMiddleware;
  private config: ConfigurationManager;

  constructor(apiKey: string, config: ConfigurationManager) {
    const client = new ClockifyApiClient(apiKey, config.getApiUrl());
    this.userService = new UserService(client);
    this.workspaceService = new WorkspaceService(client);
    this.projectService = new ProjectService(client);
    this.clientService = new ClientService(client);
    this.timeEntryService = new TimeEntryService(client);
    this.tagService = new TagService(client);
    this.taskService = new TaskService(client);
    this.reportService = new ReportService(client);
    this.customFieldService = new CustomFieldService(client);
    this.restrictionMiddleware = new RestrictionMiddleware(config, client);
    this.config = config;
  }

  getRestrictionMiddleware(): RestrictionMiddleware {
    return this.restrictionMiddleware;
  }

  private async enrichTimeEntries(
    workspaceId: string,
    entries: any[]
  ): Promise<any[]> {
    if (entries.length === 0) return entries;

    // Collect unique project and task IDs
    const projectIds = [...new Set(entries.map(e => e.projectId).filter(Boolean))] as string[];
    const taskPairs = entries
      .filter(e => e.taskId && e.projectId)
      .map(e => ({ taskId: e.taskId as string, projectId: e.projectId as string }));
    const uniqueTaskPairs = taskPairs.filter(
      (pair, i, arr) => arr.findIndex(p => p.taskId === pair.taskId) === i
    );

    // Fetch projects and tasks in parallel
    const [projectResults, taskResults] = await Promise.all([
      Promise.all(
        projectIds.map(id =>
          this.projectService.getProjectById(workspaceId, id).catch(() => null)
        )
      ),
      Promise.all(
        uniqueTaskPairs.map(({ taskId, projectId }) =>
          this.taskService.getTaskById(workspaceId, projectId, taskId).catch(() => null)
        )
      ),
    ]);

    const projectMap = new Map<string, string>();
    projectIds.forEach((id, i) => {
      if (projectResults[i]) projectMap.set(id, projectResults[i]!.name);
    });

    const taskMap = new Map<string, string>();
    uniqueTaskPairs.forEach(({ taskId }, i) => {
      if (taskResults[i]) taskMap.set(taskId, taskResults[i]!.name);
    });

    const timezone = this.config.getTimezone();
    return entries.map(entry => ({
      ...entry,
      project: entry.projectId
        ? { id: entry.projectId, name: projectMap.get(entry.projectId) ?? entry.projectId }
        : undefined,
      task: entry.taskId
        ? { id: entry.taskId, name: taskMap.get(entry.taskId) ?? entry.taskId }
        : undefined,
      timeInterval: {
        ...entry.timeInterval,
        localStart: formatLocalTime(entry.timeInterval?.start, timezone),
        localEnd: formatLocalTime(entry.timeInterval?.end, timezone),
      },
    }));
  }

  private isProtectedProject(projectId: string): { isProtected: boolean; reason?: string } {
    const defaultProjectId = this.config.getDefaultProjectId();
    const restrictions = this.config.getRestrictions();

    // Check if it's the default project
    if (defaultProjectId && projectId === defaultProjectId) {
      return {
        isProtected: true,
        reason:
          'This is the configured default project. Please update your configuration to remove the default project setting first.',
      };
    }

    // Check if it's the only allowed project in a restricted setup
    if (
      restrictions.allowedProjects &&
      restrictions.allowedProjects.length === 1 &&
      restrictions.allowedProjects[0] === projectId
    ) {
      return {
        isProtected: true,
        reason:
          'This is the only allowed project in the configuration. Please update your allowedProjects configuration first.',
      };
    }

    return { isProtected: false };
  }

  private isConfiguredProject(projectId: string): boolean {
    const defaultProjectId = this.config.getDefaultProjectId();
    const restrictions = this.config.getRestrictions();

    return (
      (defaultProjectId !== undefined && projectId === defaultProjectId) ||
      (restrictions.allowedProjects !== undefined &&
        restrictions.allowedProjects.includes(projectId))
    );
  }

  private getAllTools(): ToolDefinition[] {
    return [
      // User Tools
      {
        name: 'get_current_user',
        description: 'Get information about the currently authenticated user',
        category: 'user',
        priority: 1,
        inputSchema: z.object({}),
        handler: async () => {
          const user = await this.userService.getCurrentUser();
          return { success: true, data: user };
        },
      },
      {
        name: 'get_user',
        description: 'Get information about a specific user',
        category: 'user',
        priority: 3,
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: schemas.objectIdSchema.describe('The user ID'),
        }),
        handler: async (
          input: z.infer<typeof schemas.workspaceIdSchema & typeof schemas.userIdSchema>
        ) => {
          const user = await this.userService.getUserById(input.workspaceId, input.userId);
          return { success: true, data: user };
        },
      },
      {
        name: 'list_users',
        description: 'List all users in a workspace',
        category: 'user',
        priority: 2,
        inputSchema: schemas.workspaceIdSchema.extend(schemas.searchUsersSchema.shape),
        handler: async (input: any) => {
          const users = await this.userService.getAllUsers(input.workspaceId, input);
          return { success: true, data: users };
        },
      },
      {
        name: 'find_user_by_name',
        description: 'Find users by name (partial match)',
        category: 'search',
        priority: 5,
        inputSchema: schemas.workspaceIdSchema.extend({
          name: z.string().describe('Name to search for (partial match)'),
        }),
        handler: async (input: any) => {
          const users = await this.userService.findUserByName(input.workspaceId, input.name);
          return { success: true, data: users };
        },
      },

      // Workspace Tools
      {
        name: 'list_workspaces',
        description: 'List all workspaces accessible to the user (filtered by restrictions)',
        category: 'workspace',
        priority: 1,
        inputSchema: z.object({}),
        handler: async () => {
          const workspaces = await this.workspaceService.getAllWorkspaces();
          const filteredWorkspaces = this.restrictionMiddleware.filterWorkspaces(workspaces);
          return { success: true, data: filteredWorkspaces };
        },
      },
      {
        name: 'get_workspace',
        category: 'workspace',
        priority: 2,
        description: 'Get details of a specific workspace',
        inputSchema: schemas.workspaceIdSchema,
        handler: async (input: z.infer<typeof schemas.workspaceIdSchema>) => {
          const workspace = await this.workspaceService.getWorkspaceById(input.workspaceId);
          return { success: true, data: workspace };
        },
      },
      {
        name: 'update_workspace',
        category: 'workspace',
        priority: 3,
        description: 'Update workspace settings',
        inputSchema: schemas.workspaceIdSchema.extend({
          name: z.string().optional().describe('New workspace name'),
          imageUrl: z.string().optional().describe('New workspace image URL'),
          settings: z
            .object({
              timeRoundingInReports: z
                .boolean()
                .optional()
                .describe('Enable time rounding in reports'),
              onlyAdminsSeeBillableRates: z
                .boolean()
                .optional()
                .describe('Only admins can see billable rates'),
              onlyAdminsCreateProject: z
                .boolean()
                .optional()
                .describe('Only admins can create projects'),
              onlyAdminsSeeDashboard: z
                .boolean()
                .optional()
                .describe('Only admins can see dashboard'),
              defaultBillableProjects: z
                .boolean()
                .optional()
                .describe('Make projects billable by default'),
              lockTimeEntries: z.string().optional().describe('Time entry locking policy'),
              round: z
                .object({
                  round: z.string().describe('Rounding rule'),
                  minutes: z.string().describe('Rounding minutes'),
                })
                .optional()
                .describe('Time rounding settings'),
            })
            .optional()
            .describe('Workspace settings to update'),
        }),
        handler: async (input: any) => {
          // Strong protection: workspace changes can affect all configured projects
          const restrictions = this.config.getRestrictions();
          const defaultProjectId = this.config.getDefaultProjectId();

          if (defaultProjectId || restrictions.allowedProjects) {
            // Specific dangerous settings changes
            if (input.settings?.onlyAdminsCreateProject === true) {
              throw new Error(
                'Cannot enable "only admins create project" setting when projects are configured. This could prevent access to project functionality.'
              );
            }

            if (input.settings?.lockTimeEntries) {
              console.warn(
                'Warning: Changing time entry locking policy with configured projects. This may affect existing time tracking workflows.'
              );
            }

            // General warning for any settings change
            console.warn(
              'Warning: Updating workspace settings with configured projects. Ensure these changes do not affect required project functionality.'
            );
          }

          const { workspaceId, ...data } = input;
          const workspace = await this.workspaceService.updateWorkspace(workspaceId, data);
          return { success: true, data: workspace };
        },
      },
      {
        name: 'delete_workspace',
        category: 'workspace',
        priority: 4,
        description: 'Delete a workspace',
        inputSchema: schemas.workspaceIdSchema,
        handler: async (input: z.infer<typeof schemas.workspaceIdSchema>) => {
          // Absolute protection: never allow deleting workspace with configured projects
          const restrictions = this.config.getRestrictions();
          const defaultProjectId = this.config.getDefaultProjectId();
          const defaultWorkspaceId = this.config.getDefaultWorkspaceId();

          // Check if this is the default workspace
          if (defaultWorkspaceId && input.workspaceId === defaultWorkspaceId) {
            throw new Error(
              'Cannot delete the configured default workspace. Please update your configuration first.'
            );
          }

          // Check if this workspace contains configured projects
          if (defaultProjectId || restrictions.allowedProjects) {
            throw new Error(
              'Cannot delete workspace: This workspace contains configured projects. Please update your configuration to remove project restrictions first.'
            );
          }

          await this.workspaceService.deleteWorkspace(input.workspaceId);
          return { success: true, message: 'Workspace deleted successfully' };
        },
      },

      // Project Tools
      {
        name: 'list_projects',
        category: 'project',
        priority: 1,
        description: 'List all projects in a workspace (filtered by restrictions)',
        inputSchema: schemas.searchProjectsSchema,
        handler: async (input: z.infer<typeof schemas.searchProjectsSchema>) => {
          const projects = await this.projectService.getAllProjects(input.workspaceId, input);
          const filteredProjects = this.restrictionMiddleware.filterProjects(projects);
          return { success: true, data: filteredProjects };
        },
      },
      {
        name: 'get_project',
        category: 'project',
        priority: 2,
        description: 'Get details of a specific project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
        }),
        handler: async (input: any) => {
          const project = await this.projectService.getProjectById(
            input.workspaceId,
            input.projectId
          );
          return { success: true, data: project };
        },
      },
      {
        name: 'create_project',
        category: 'project',
        priority: 3,
        description: 'Create a new project',
        inputSchema: schemas.createProjectSchema,
        handler: async (input: z.infer<typeof schemas.createProjectSchema>) => {
          const project = await this.projectService.createProject(input.workspaceId, input);
          return { success: true, data: project };
        },
      },
      {
        name: 'update_project',
        category: 'project',
        priority: 4,
        description: 'Update an existing project',
        inputSchema: schemas.updateProjectSchema,
        handler: async (input: z.infer<typeof schemas.updateProjectSchema>) => {
          const { workspaceId, projectId, ...data } = input;

          // Check if this is a configured project and if critical fields are being changed
          if (this.isConfiguredProject(projectId)) {
            // Don't allow archiving configured projects through update
            if (data.archived === true) {
              throw new Error(
                'Cannot archive a configured project through update. Please update your configuration first.'
              );
            }

            // Warn about critical field changes but allow them (name, client changes might be intentional)
            if (data.name || data.clientId !== undefined) {
              console.warn(
                `Warning: Updating critical fields of configured project ${projectId}. Ensure this change is intentional.`
              );
            }
          }

          const project = await this.projectService.updateProject(workspaceId, projectId, data);
          return { success: true, data: project };
        },
      },
      {
        name: 'archive_project',
        category: 'project',
        priority: 5,
        description: 'Archive a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID to archive'),
        }),
        handler: async (input: any) => {
          const protection = this.isProtectedProject(input.projectId);
          if (protection.isProtected) {
            throw new Error(`Cannot archive project: ${protection.reason}`);
          }

          const project = await this.projectService.archiveProject(
            input.workspaceId,
            input.projectId
          );
          return { success: true, data: project };
        },
      },
      {
        name: 'delete_project',
        category: 'project',
        priority: 6,
        description: 'Delete a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID to delete'),
        }),
        handler: async (input: any) => {
          const protection = this.isProtectedProject(input.projectId);
          if (protection.isProtected) {
            throw new Error(`Cannot delete project: ${protection.reason}`);
          }

          await this.projectService.deleteProject(input.workspaceId, input.projectId);
          return { success: true, message: 'Project deleted successfully' };
        },
      },
      {
        name: 'add_user_to_project',
        category: 'project',
        priority: 7,
        description: 'Add a user to a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          userId: schemas.objectIdSchema.describe('The user ID to add'),
          hourlyRate: z
            .object({
              amount: z.number().describe('Hourly rate amount'),
              currency: z.string().describe('Currency code (e.g., USD, EUR)'),
            })
            .optional()
            .describe('Hourly rate for this user on this project'),
        }),
        handler: async (input: any) => {
          // No restriction needed for adding users to projects
          const result = await this.projectService.addUserToProject(
            input.workspaceId,
            input.projectId,
            input.userId,
            input.hourlyRate ? { hourlyRate: input.hourlyRate } : undefined
          );
          return { success: true, data: result };
        },
      },
      {
        name: 'remove_user_from_project',
        category: 'project',
        priority: 8,
        description: 'Remove a user from a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          userId: schemas.objectIdSchema.describe('The user ID to remove'),
        }),
        handler: async (input: any) => {
          // Check if this is a configured project - don't allow removing access
          if (this.isConfiguredProject(input.projectId)) {
            throw new Error(
              'Cannot remove users from a configured project. This could break access to required project functionality.'
            );
          }

          await this.projectService.removeUserFromProject(
            input.workspaceId,
            input.projectId,
            input.userId
          );
          return { success: true, message: 'User removed from project successfully' };
        },
      },
      {
        name: 'find_project_by_name',
        category: 'search',
        priority: 2,
        description: 'Find projects by name',
        inputSchema: schemas.workspaceIdSchema.extend({
          name: z.string().describe('Project name to search for'),
        }),
        handler: async (input: any) => {
          const projects = await this.projectService.findProjectByName(
            input.workspaceId,
            input.name
          );
          return { success: true, data: projects };
        },
      },

      // Client Tools
      {
        name: 'list_clients',
        category: 'client',
        priority: 1,
        description: 'List all clients in a workspace',
        inputSchema: schemas.workspaceIdSchema.extend({
          archived: z.boolean().optional().describe('Include archived clients'),
        }),
        handler: async (input: any) => {
          const clients = await this.clientService.getAllClients(input.workspaceId, input);
          return { success: true, data: clients };
        },
      },
      {
        name: 'get_client',
        category: 'client',
        priority: 2,
        description: 'Get details of a specific client',
        inputSchema: schemas.workspaceIdSchema.extend({
          clientId: schemas.objectIdSchema.describe('The client ID'),
        }),
        handler: async (input: any) => {
          const client = await this.clientService.getClientById(input.workspaceId, input.clientId);
          return { success: true, data: client };
        },
      },
      {
        name: 'create_client',
        category: 'client',
        priority: 3,
        description: 'Create a new client',
        inputSchema: schemas.createClientSchema,
        handler: async (input: z.infer<typeof schemas.createClientSchema>) => {
          const { workspaceId, ...data } = input;
          const client = await this.clientService.createClient(workspaceId, data);
          return { success: true, data: client };
        },
      },
      {
        name: 'update_client',
        category: 'client',
        priority: 4,
        description: 'Update an existing client',
        inputSchema: schemas.workspaceIdSchema.extend({
          clientId: schemas.objectIdSchema.describe('The client ID'),
          name: z.string().optional(),
          email: z.string().email().optional(),
          address: z.string().optional(),
          note: z.string().optional(),
          archived: z.boolean().optional(),
        }),
        handler: async (input: any) => {
          const { workspaceId, clientId, ...data } = input;
          const client = await this.clientService.updateClient(workspaceId, clientId, data);
          return { success: true, data: client };
        },
      },
      {
        name: 'delete_client',
        category: 'client',
        priority: 5,
        description: 'Delete a client',
        inputSchema: schemas.workspaceIdSchema.extend({
          clientId: schemas.objectIdSchema.describe('The client ID to delete'),
        }),
        handler: async (input: any) => {
          // Check if any configured projects depend on this client
          const restrictions = this.config.getRestrictions();
          const defaultProjectId = this.config.getDefaultProjectId();

          // If we have configured projects, check if they use this client
          if (defaultProjectId || restrictions.allowedProjects) {
            // Get projects that might be using this client
            try {
              const projects = await this.projectService.getProjectsForClient(
                input.workspaceId,
                input.clientId
              );
              const configuredProjects = projects.filter(p => this.isConfiguredProject(p.id));

              if (configuredProjects.length > 0) {
                const projectNames = configuredProjects.map(p => p.name).join(', ');
                throw new Error(
                  `Cannot delete client: The following configured projects depend on this client: ${projectNames}. Please update your project configuration first.`
                );
              }
            } catch (error) {
              // If we can't check, err on the side of caution
              if (error instanceof Error && !error.message.includes('Cannot delete client')) {
                console.warn(
                  'Warning: Unable to verify client dependencies for configured projects. Proceeding with deletion.'
                );
              } else {
                throw error;
              }
            }
          }

          await this.clientService.deleteClient(input.workspaceId, input.clientId);
          return { success: true, message: 'Client deleted successfully' };
        },
      },

      // Time Entry Tools
      {
        name: 'create_time_entry',
        category: 'timeEntry',
        priority: 1,
        description: 'Create a new time entry (start tracking time)',
        inputSchema: schemas.createTimeEntrySchema,
        handler: async (input: z.infer<typeof schemas.createTimeEntrySchema>) => {
          const { workspaceId, ...data } = input;
          const entry = await this.timeEntryService.createTimeEntry(workspaceId, data);
          return { success: true, data: entry };
        },
      },
      {
        name: 'update_time_entry',
        category: 'timeEntry',
        priority: 3,
        description: 'Update an existing time entry',
        inputSchema: schemas.updateTimeEntrySchema,
        handler: async (input: z.infer<typeof schemas.updateTimeEntrySchema>) => {
          const { workspaceId, timeEntryId, ...data } = input;

          // If no projectId provided, preserve the existing one to avoid workspace validation errors
          if (!data.projectId) {
            try {
              const existing = await this.timeEntryService.getTimeEntryById(
                workspaceId,
                timeEntryId
              );
              if (existing.projectId) {
                data.projectId = existing.projectId;
              }
            } catch (error) {
              console.error('[claude-clockify] Could not fetch existing time entry for projectId preservation:', error instanceof Error ? error.message : String(error));
            }
          }

          const entry = await this.timeEntryService.updateTimeEntry(workspaceId, timeEntryId, data);
          return { success: true, data: entry };
        },
      },
      {
        name: 'delete_time_entry',
        category: 'timeEntry',
        priority: 4,
        description: 'Delete a time entry',
        inputSchema: schemas.workspaceIdSchema.extend({
          timeEntryId: schemas.objectIdSchema.describe('The time entry ID to delete'),
        }),
        handler: async (input: any) => {
          await this.timeEntryService.deleteTimeEntry(input.workspaceId, input.timeEntryId);
          return { success: true, message: 'Time entry deleted successfully' };
        },
      },
      {
        name: 'get_time_entries',
        category: 'timeEntry',
        priority: 2,
        description: 'Get time entries for a user',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: schemas.objectIdSchema.describe('The user ID'),
          start: z.string().optional().describe('Start date in ISO format'),
          end: z.string().optional().describe('End date in ISO format'),
          projectId: z.string().optional().describe('Filter by project ID'),
          description: z.string().optional().describe('Filter by description'),
        }),
        handler: async (input: any) => {
          const { workspaceId, userId, projectId, ...options } = input;
          const entries = await this.timeEntryService.getTimeEntriesForUser(
            workspaceId,
            userId,
            projectId ? { ...options, project: projectId } : options
          );
          return { success: true, data: await this.enrichTimeEntries(workspaceId, entries) };
        },
      },
      {
        name: 'get_running_timer',
        category: 'timeEntry',
        priority: 5,
        description: 'Get the currently running timer for a user',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: schemas.objectIdSchema.describe('The user ID'),
        }),
        handler: async (input: any) => {
          const entry = await this.timeEntryService.getRunningTimeEntry(
            input.workspaceId,
            input.userId
          );
          return { success: true, data: entry };
        },
      },
      {
        name: 'get_time_entry_by_id',
        category: 'timeEntry',
        priority: 2,
        description: 'Get a specific time entry by ID',
        inputSchema: schemas.workspaceIdSchema.extend({
          timeEntryId: schemas.objectIdSchema.describe('The time entry ID'),
          hydrated: z
            .boolean()
            .optional()
            .describe('Include related entities (project, task, user, etc.)'),
        }),
        handler: async (input: any) => {
          const entry = await this.timeEntryService.getTimeEntryById(
            input.workspaceId,
            input.timeEntryId
          );
          const [enriched] = await this.enrichTimeEntries(input.workspaceId, [entry]);
          return { success: true, data: enriched };
        },
      },
      {
        name: 'duplicate_time_entry',
        category: 'timeEntry',
        priority: 7,
        description: 'Duplicate an existing time entry',
        inputSchema: schemas.workspaceIdSchema.extend({
          timeEntryId: schemas.objectIdSchema.describe('The time entry ID to duplicate'),
        }),
        handler: async (input: any) => {
          const entry = await this.timeEntryService.duplicateTimeEntry(
            input.workspaceId,
            input.timeEntryId
          );
          return { success: true, data: entry };
        },
      },
      {
        name: 'start_timer',
        category: 'timeEntry',
        priority: 5,
        description: 'Start a new timer (creates running time entry)',
        inputSchema: schemas.startTimerSchema,
        handler: async (input: z.infer<typeof schemas.startTimerSchema>) => {
          const timerData = {
            ...input,
            start: new Date().toISOString(),
            // Don't include end time to create a running timer
          };
          const entry = await this.timeEntryService.createTimeEntry(input.workspaceId, timerData);
          return { success: true, data: entry };
        },
      },
      {
        name: 'stop_timer',
        category: 'timeEntry',
        priority: 6,
        description: 'Stop the currently running timer',
        inputSchema: schemas.stopTimerSchema,
        handler: async (input: z.infer<typeof schemas.stopTimerSchema>) => {
          const userId = input.userId || (await this.userService.getCurrentUser()).id;
          const entry = await this.timeEntryService.stopRunningTimer(input.workspaceId, userId, {
            end: new Date().toISOString(),
          });
          return { success: true, data: entry };
        },
      },
      {
        name: 'get_today_entries',
        category: 'timeEntry',
        priority: 7,
        description: 'Get all time entries for today',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: schemas.objectIdSchema.describe('The user ID'),
        }),
        handler: async (input: any) => {
          const entries = await this.timeEntryService.getTodayTimeEntries(
            input.workspaceId,
            input.userId
          );
          return { success: true, data: await this.enrichTimeEntries(input.workspaceId, entries) };
        },
      },
      {
        name: 'get_week_entries',
        category: 'timeEntry',
        priority: 8,
        description: 'Get all time entries for the current week',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: schemas.objectIdSchema.describe('The user ID'),
        }),
        handler: async (input: any) => {
          const entries = await this.timeEntryService.getWeekTimeEntries(
            input.workspaceId,
            input.userId
          );
          return { success: true, data: await this.enrichTimeEntries(input.workspaceId, entries) };
        },
      },
      {
        name: 'get_month_entries',
        category: 'timeEntry',
        priority: 9,
        description: 'Get all time entries for a specific month',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: schemas.objectIdSchema.describe('The user ID'),
          year: z.number().optional().describe('Year (defaults to current year)'),
          month: z.number().optional().describe('Month (0-11, defaults to current month)'),
        }),
        handler: async (input: any) => {
          const entries = await this.timeEntryService.getMonthTimeEntries(
            input.workspaceId,
            input.userId,
            input.year,
            input.month
          );
          return { success: true, data: await this.enrichTimeEntries(input.workspaceId, entries) };
        },
      },
      {
        name: 'bulk_edit_time_entries',
        category: 'bulk',
        priority: 1,
        description: 'Bulk edit multiple time entries',
        inputSchema: schemas.bulkTimeEntriesSchema,
        handler: async (input: z.infer<typeof schemas.bulkTimeEntriesSchema>) => {
          const { workspaceId, timeEntryIds, action, updates } = input;

          // For bulk updates that change project assignment, validate the change
          if (action === 'UPDATE' && updates?.projectId) {
            // Check if we're trying to move entries away from a configured project
            const restrictions = this.config.getRestrictions();
            const defaultProjectId = this.config.getDefaultProjectId();

            // If we have configured projects, warn about bulk moves
            if (defaultProjectId || restrictions.allowedProjects) {
              console.warn(
                'Warning: Bulk operation is changing project assignments. Ensure this does not affect configured project requirements.'
              );
            }

            // Don't allow moving TO a configured project in bulk (could overwhelm it)
            if (this.isConfiguredProject(updates.projectId)) {
              throw new Error(
                'Cannot bulk assign time entries to a configured project. Please assign individually to avoid overwhelming the configured project.'
              );
            }
          }

          if (action === 'DELETE') {
            await this.timeEntryService.bulkDeleteTimeEntries(workspaceId, timeEntryIds);
            return { success: true, message: 'Time entries deleted successfully' };
          } else {
            const result = await this.timeEntryService.bulkEditTimeEntries(
              workspaceId,
              timeEntryIds,
              updates || {}
            );
            return { success: true, data: result };
          }
        },
      },

      // Tag Tools
      {
        name: 'list_tags',
        category: 'tag',
        priority: 1,
        description: 'List all tags in a workspace',
        inputSchema: schemas.workspaceIdSchema.extend({
          archived: z.boolean().optional().describe('Include archived tags'),
        }),
        handler: async (input: any) => {
          const tags = await this.tagService.getAllTags(input.workspaceId, input);
          return { success: true, data: tags };
        },
      },
      {
        name: 'create_tag',
        category: 'tag',
        priority: 2,
        description: 'Create a new tag',
        inputSchema: schemas.createTagSchema,
        handler: async (input: z.infer<typeof schemas.createTagSchema>) => {
          const { workspaceId, ...data } = input;
          const tag = await this.tagService.createTag(workspaceId, data);
          return { success: true, data: tag };
        },
      },
      {
        name: 'create_multiple_tags',
        category: 'tag',
        priority: 3,
        description: 'Create multiple tags at once',
        inputSchema: schemas.workspaceIdSchema.extend({
          names: z.array(z.string()).describe('Array of tag names to create'),
        }),
        handler: async (input: any) => {
          const tags = await this.tagService.createMultipleTags(input.workspaceId, input.names);
          return { success: true, data: tags };
        },
      },
      {
        name: 'delete_tag',
        category: 'tag',
        priority: 4,
        description: 'Delete a tag',
        inputSchema: schemas.workspaceIdSchema.extend({
          tagId: schemas.objectIdSchema.describe('The tag ID to delete'),
        }),
        handler: async (input: any) => {
          // Tags can be deleted freely as they don't fundamentally affect configured projects
          // But warn if workspace has configured projects that might use this tag
          const restrictions = this.config.getRestrictions();
          const defaultProjectId = this.config.getDefaultProjectId();

          if (defaultProjectId || restrictions.allowedProjects) {
            console.warn(
              'Warning: Deleting tag from workspace with configured projects. Ensure this tag is not required for project workflows.'
            );
          }

          await this.tagService.deleteTag(input.workspaceId, input.tagId);
          return { success: true, message: 'Tag deleted successfully' };
        },
      },

      // Task Tools
      {
        name: 'list_tasks',
        category: 'task',
        priority: 1,
        description: 'List all tasks in a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          isActive: z.boolean().optional().describe('Filter by active status'),
        }),
        handler: async (input: any) => {
          const tasks = await this.taskService.getAllTasks(
            input.workspaceId,
            input.projectId,
            input
          );
          return { success: true, data: tasks };
        },
      },
      {
        name: 'create_task',
        category: 'task',
        priority: 2,
        description: 'Create a new task in a project',
        inputSchema: schemas.createTaskSchema,
        handler: async (input: z.infer<typeof schemas.createTaskSchema>) => {
          const { workspaceId, projectId, ...data } = input;
          const task = await this.taskService.createTask(workspaceId, projectId, data);
          return { success: true, data: task };
        },
      },
      {
        name: 'update_task',
        category: 'task',
        priority: 3,
        description: 'Update an existing task',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          taskId: schemas.objectIdSchema.describe('The task ID'),
          name: z.string().optional(),
          assigneeIds: z.array(z.string()).optional(),
          estimate: z.string().optional(),
          status: z.enum(['ACTIVE', 'DONE']).optional(),
          billable: z.boolean().optional(),
        }),
        handler: async (input: any) => {
          const { workspaceId, projectId, taskId, ...data } = input;
          const task = await this.taskService.updateTask(workspaceId, projectId, taskId, data);
          return { success: true, data: task };
        },
      },
      {
        name: 'mark_task_done',
        category: 'task',
        priority: 4,
        description: 'Mark a task as done',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          taskId: schemas.objectIdSchema.describe('The task ID'),
        }),
        handler: async (input: any) => {
          const task = await this.taskService.markTaskAsDone(
            input.workspaceId,
            input.projectId,
            input.taskId
          );
          return { success: true, data: task };
        },
      },
      {
        name: 'delete_task',
        category: 'task',
        priority: 5,
        description: 'Delete a task from a project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          taskId: schemas.objectIdSchema.describe('The task ID to delete'),
        }),
        handler: async (input: any) => {
          // Strong protection: don't allow deleting tasks from configured projects
          if (this.isConfiguredProject(input.projectId)) {
            throw new Error(
              'Cannot delete tasks from a configured project. Tasks in configured projects may be essential for required workflows.'
            );
          }

          await this.taskService.deleteTask(input.workspaceId, input.projectId, input.taskId);
          return { success: true, message: 'Task deleted successfully' };
        },
      },

      // Report Tools
      {
        name: 'get_summary_report',
        category: 'report',
        priority: 1,
        description: 'Generate a summary report',
        inputSchema: schemas.reportRequestSchema,
        handler: async (input: z.infer<typeof schemas.reportRequestSchema>) => {
          const { workspaceId, userIds, projectIds, clientIds, tagIds, groupBy, ...request } =
            input;
          const reportRequest: any = {
            dateRangeStart: request.dateRangeStart,
            dateRangeEnd: request.dateRangeEnd,
            billable: request.billable,
          };

          if (userIds) reportRequest.users = { ids: userIds, contains: 'CONTAINS' };
          if (projectIds) reportRequest.projects = { ids: projectIds, contains: 'CONTAINS' };
          if (clientIds) reportRequest.clients = { ids: clientIds, contains: 'CONTAINS' };
          if (tagIds) reportRequest.tags = { ids: tagIds, contains: 'CONTAINS' };
          if (groupBy) reportRequest.summaryFilter = { groups: groupBy };

          const report = await this.reportService.getSummaryReport(workspaceId, reportRequest);
          return { success: true, data: report };
        },
      },
      {
        name: 'get_user_productivity_report',
        category: 'report',
        priority: 2,
        description: 'Get productivity report for a specific user',
        inputSchema: schemas.workspaceIdSchema.extend({
          userId: schemas.objectIdSchema.describe('The user ID'),
          start: z.string().describe('Start date in ISO format'),
          end: z.string().describe('End date in ISO format'),
        }),
        handler: async (input: any) => {
          const report = await this.reportService.getUserProductivityReport(
            input.workspaceId,
            input.userId,
            { start: input.start, end: input.end }
          );
          return { success: true, data: report };
        },
      },
      {
        name: 'get_project_progress_report',
        category: 'report',
        priority: 3,
        description: 'Get progress report for a specific project',
        inputSchema: schemas.workspaceIdSchema.extend({
          projectId: schemas.objectIdSchema.describe('The project ID'),
          start: z.string().describe('Start date in ISO format'),
          end: z.string().describe('End date in ISO format'),
        }),
        handler: async (input: any) => {
          const report = await this.reportService.getProjectProgressReport(
            input.workspaceId,
            input.projectId,
            { start: input.start, end: input.end }
          );
          return { success: true, data: report };
        },
      },
      {
        name: 'get_team_utilization_report',
        category: 'report',
        priority: 4,
        description: 'Get team utilization report',
        inputSchema: schemas.workspaceIdSchema.extend({
          start: z.string().describe('Start date in ISO format'),
          end: z.string().describe('End date in ISO format'),
        }),
        handler: async (input: any) => {
          const report = await this.reportService.getTeamUtilizationReport(input.workspaceId, {
            start: input.start,
            end: input.end,
          });
          return { success: true, data: report };
        },
      },
      {
        name: 'export_report',
        category: 'report',
        priority: 5,
        description: 'Export a report in various formats',
        inputSchema: schemas.reportRequestSchema.extend({
          format: z.enum(['CSV', 'PDF', 'EXCEL']).describe('Export format'),
        }),
        handler: async (input: any) => {
          const {
            workspaceId,
            format,
            userIds,
            projectIds,
            clientIds,
            tagIds,
            groupBy,
            ...request
          } = input;
          const reportRequest: any = {
            dateRangeStart: request.dateRangeStart,
            dateRangeEnd: request.dateRangeEnd,
            billable: request.billable,
          };

          if (userIds) reportRequest.users = { ids: userIds, contains: 'CONTAINS' };
          if (projectIds) reportRequest.projects = { ids: projectIds, contains: 'CONTAINS' };
          if (clientIds) reportRequest.clients = { ids: clientIds, contains: 'CONTAINS' };
          if (tagIds) reportRequest.tags = { ids: tagIds, contains: 'CONTAINS' };
          if (groupBy) reportRequest.summaryFilter = { groups: groupBy };

          const report = await this.reportService.exportReport(workspaceId, format, reportRequest);
          return { success: true, data: report };
        },
      },

      // Custom Field Tools
      {
        name: 'get_custom_fields',
        category: 'customField',
        priority: 1,
        description: 'Get all custom fields for a workspace',
        inputSchema: schemas.workspaceIdSchema,
        handler: async (input: z.infer<typeof schemas.workspaceIdSchema>) => {
          const customFields = await this.customFieldService.getAllCustomFields(input.workspaceId);
          return { success: true, data: customFields };
        },
      },
      {
        name: 'create_custom_field',
        category: 'customField',
        priority: 2,
        description: 'Create a new custom field',
        inputSchema: schemas.createCustomFieldSchema,
        handler: async (input: z.infer<typeof schemas.createCustomFieldSchema>) => {
          const { workspaceId, ...data } = input;
          const customField = await this.customFieldService.createCustomField(workspaceId, data);
          return { success: true, data: customField };
        },
      },
      {
        name: 'update_custom_field',
        category: 'customField',
        priority: 3,
        description: 'Update an existing custom field',
        inputSchema: schemas.updateCustomFieldSchema,
        handler: async (input: z.infer<typeof schemas.updateCustomFieldSchema>) => {
          const { workspaceId, customFieldId, ...data } = input;
          const customField = await this.customFieldService.updateCustomField(
            workspaceId,
            customFieldId,
            data
          );
          return { success: true, data: customField };
        },
      },
      {
        name: 'delete_custom_field',
        category: 'customField',
        priority: 4,
        description: 'Delete a custom field',
        inputSchema: schemas.workspaceIdSchema.extend({
          customFieldId: schemas.objectIdSchema.describe('The custom field ID to delete'),
        }),
        handler: async (input: any) => {
          await this.customFieldService.deleteCustomField(input.workspaceId, input.customFieldId);
          return { success: true, message: 'Custom field deleted successfully' };
        },
      },
      {
        name: 'get_custom_field_by_id',
        category: 'customField',
        priority: 5,
        description: 'Get a specific custom field by ID',
        inputSchema: schemas.workspaceIdSchema.extend({
          customFieldId: schemas.objectIdSchema.describe('The custom field ID'),
        }),
        handler: async (input: any) => {
          const customField = await this.customFieldService.getCustomFieldById(
            input.workspaceId,
            input.customFieldId
          );
          return { success: true, data: customField };
        },
      },
    ];
  }

  private filterTools(allTools: ToolDefinition[]): ToolDefinition[] {
    const filtering = this.config.getToolFiltering();

    // If specific tools are enabled, only include those
    if (filtering.enabledTools && filtering.enabledTools.length > 0) {
      const enabledSet = new Set(filtering.enabledTools);
      return allTools.filter(tool => enabledSet.has(tool.name)).slice(0, filtering.maxTools);
    }

    // Filter by categories
    const enabledCategories = new Set(filtering.enabledCategories);
    let filteredTools = allTools.filter(tool => enabledCategories.has(tool.category as any));

    // Remove disabled tools
    if (filtering.disabledTools && filtering.disabledTools.length > 0) {
      const disabledSet = new Set(filtering.disabledTools);
      filteredTools = filteredTools.filter(tool => !disabledSet.has(tool.name));
    }

    // Sort by priority (lower number = higher priority)
    filteredTools.sort((a, b) => (a.priority || 99) - (b.priority || 99));

    // Limit to max tools
    return filteredTools.slice(0, filtering.maxTools);
  }

  getTools() {
    const allTools = this.getAllTools();
    const filteredTools = this.filterTools(allTools);

    return filteredTools.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      handler: tool.handler,
    }));
  }

  getToolCategories(): string[] {
    return [
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
    ];
  }

  getAvailableToolNames(): string[] {
    return this.getAllTools().map(tool => tool.name);
  }

  getToolsByCategory(category: string): string[] {
    return this.getAllTools()
      .filter(tool => tool.category === category)
      .map(tool => tool.name);
  }
}

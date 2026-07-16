import { z } from 'zod';
// MongoDB ObjectId validation - 24 character hex string
export const objectIdSchema = z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid 24-character hex string (MongoDB ObjectId)');
export const workspaceIdSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
});
export const userIdSchema = z.object({
    userId: objectIdSchema.describe('The user ID'),
});
export const projectIdSchema = z.object({
    projectId: objectIdSchema.describe('The project ID'),
});
export const clientIdSchema = z.object({
    clientId: objectIdSchema.describe('The client ID'),
});
export const tagIdSchema = z.object({
    tagId: objectIdSchema.describe('The tag ID'),
});
export const taskIdSchema = z.object({
    taskId: objectIdSchema.describe('The task ID'),
});
export const timeEntryIdSchema = z.object({
    timeEntryId: objectIdSchema.describe('The time entry ID'),
});
export const dateRangeSchema = z.object({
    start: z.string().describe('Start date/time in ISO 8601 format'),
    end: z.string().describe('End date/time in ISO 8601 format'),
});
export const paginationSchema = z.object({
    page: z.number().optional().describe('Page number (1-based)'),
    pageSize: z.number().optional().describe('Number of items per page'),
});
export const createTimeEntrySchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    description: z
        .string()
        .transform(desc => desc.replace(/<[^>]*>/g, '').trim())
        .describe('Description of the time entry'),
    start: z.string().describe('Start time in ISO 8601 format'),
    end: z.string().optional().describe('End time in ISO 8601 format (omit for running timer)'),
    projectId: objectIdSchema.optional().describe('Project ID to associate with'),
    taskId: objectIdSchema.optional().describe('Task ID to associate with'),
    tagIds: z.array(objectIdSchema).optional().describe('Array of tag IDs'),
    billable: z.boolean().optional().default(false).describe('Whether the time entry is billable'),
    hourlyRate: z
        .object({
        amount: z.number().describe('Hourly rate amount'),
        currency: z.string().describe('Currency code (e.g., USD, EUR)'),
    })
        .optional()
        .describe('Hourly rate for this entry'),
    costRate: z
        .object({
        amount: z.number().describe('Cost rate amount'),
        currency: z.string().describe('Currency code (e.g., USD, EUR)'),
    })
        .optional()
        .describe('Cost rate for this entry'),
    type: z.enum(['REGULAR', 'BREAK', 'CLOCK_IN_OUT']).optional().describe('Type of time entry'),
    kioskId: z.string().optional().describe('Kiosk ID for kiosk entries'),
    customFields: z
        .array(z.object({
        customFieldId: objectIdSchema.describe('Custom field ID'),
        value: z.union([z.string(), z.number(), z.boolean()]).describe('Custom field value'),
        sourceType: z.string().optional().describe('Source type of the custom field'),
        name: z.string().optional().describe('Name of the custom field'),
        type: z.string().optional().describe('Type of the custom field'),
    }))
        .optional()
        .describe('Custom field values'),
});
export const updateTimeEntrySchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    timeEntryId: objectIdSchema.describe('The time entry ID to update'),
    description: z
        .string()
        .optional()
        .transform(desc => (desc ? desc.replace(/<[^>]*>/g, '').trim() : desc))
        .describe('New description'),
    start: z.string().optional().describe('New start time in ISO 8601 format'),
    end: z.string().optional().describe('New end time in ISO 8601 format'),
    projectId: objectIdSchema.optional().describe('New project ID'),
    taskId: objectIdSchema.optional().describe('New task ID'),
    tagIds: z.array(objectIdSchema).optional().describe('New array of tag IDs'),
    billable: z.boolean().optional().describe('New billable status'),
    hourlyRate: z
        .object({
        amount: z.number().describe('Hourly rate amount'),
        currency: z.string().describe('Currency code (e.g., USD, EUR)'),
    })
        .optional()
        .describe('New hourly rate for this entry'),
    costRate: z
        .object({
        amount: z.number().describe('Cost rate amount'),
        currency: z.string().describe('Currency code (e.g., USD, EUR)'),
    })
        .optional()
        .describe('New cost rate for this entry'),
    type: z.enum(['REGULAR', 'BREAK', 'CLOCK_IN_OUT']).optional().describe('New type of time entry'),
    kioskId: z.string().optional().describe('New kiosk ID for kiosk entries'),
    customFields: z
        .array(z.object({
        customFieldId: objectIdSchema.describe('Custom field ID'),
        value: z.union([z.string(), z.number(), z.boolean()]).describe('Custom field value'),
        sourceType: z.string().optional().describe('Source type of the custom field'),
        name: z.string().optional().describe('Name of the custom field'),
        type: z.string().optional().describe('Type of the custom field'),
    }))
        .optional()
        .describe('Custom field values'),
});
export const createProjectSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    name: z.string().describe('Project name'),
    clientId: objectIdSchema.optional().describe('Client ID to associate with'),
    color: z.string().optional().default('#0000FF').describe('Project color in hex format'),
    billable: z.boolean().optional().default(true).describe('Whether the project is billable'),
    isPublic: z.boolean().optional().default(true).describe('Whether the project is public'),
    note: z.string().optional().describe('Project notes/description'),
    template: z.boolean().optional().default(false).describe('Whether the project is a template'),
    archived: z.boolean().optional().default(false).describe('Whether the project is archived'),
    duration: z.string().optional().describe('Project duration estimate'),
    timeEstimate: z
        .object({
        estimate: z.string().describe('Time estimate'),
        type: z.string().describe('Estimate type'),
        resetOption: z.string().optional().describe('Reset option'),
        active: z.boolean().optional().describe('Whether estimate is active'),
    })
        .optional()
        .describe('Time estimate settings'),
    budgetEstimate: z
        .object({
        estimate: z.number().describe('Budget estimate amount'),
        type: z.string().describe('Budget estimate type'),
        resetOption: z.string().optional().describe('Reset option'),
    })
        .optional()
        .describe('Budget estimate settings'),
    costRate: z
        .object({
        amount: z.number().describe('Cost rate amount'),
        currency: z.string().describe('Currency code (e.g., USD, EUR)'),
    })
        .optional()
        .describe('Default cost rate for the project'),
});
export const updateProjectSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    projectId: objectIdSchema.describe('The project ID to update'),
    name: z.string().optional().describe('New project name'),
    clientId: objectIdSchema.optional().describe('New client ID'),
    color: z.string().optional().describe('New color in hex format'),
    billable: z.boolean().optional().describe('New billable status'),
    isPublic: z.boolean().optional().describe('New public status'),
    archived: z.boolean().optional().describe('Archive/unarchive the project'),
    note: z.string().optional().describe('New project notes'),
});
export const createClientSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    name: z.string().describe('Client name'),
    email: z.string().email().optional().describe('Client email'),
    address: z.string().optional().describe('Client address'),
    note: z.string().optional().describe('Client notes'),
});
export const createTagSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    name: z.string().describe('Tag name'),
});
export const createTaskSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    projectId: objectIdSchema.describe('The project ID'),
    name: z.string().describe('Task name'),
    assigneeIds: z.array(objectIdSchema).optional().describe('Array of user IDs to assign'),
    estimate: z.string().optional().describe("Time estimate (e.g., 'PT2H30M')"),
    status: z.enum(['ACTIVE', 'DONE']).optional().default('ACTIVE').describe('Task status'),
    billable: z.boolean().optional().describe('Whether the task is billable'),
});
export const reportRequestSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    dateRangeStart: z.string().describe('Report start date in ISO 8601 format'),
    dateRangeEnd: z.string().describe('Report end date in ISO 8601 format'),
    userIds: z.array(objectIdSchema).optional().describe('Filter by user IDs'),
    projectIds: z.array(objectIdSchema).optional().describe('Filter by project IDs'),
    clientIds: z.array(objectIdSchema).optional().describe('Filter by client IDs'),
    tagIds: z.array(objectIdSchema).optional().describe('Filter by tag IDs'),
    billable: z
        .enum(['BILLABLE', 'NON_BILLABLE', 'BOTH'])
        .optional()
        .describe('Filter by billable status'),
    groupBy: z
        .array(z.enum(['USER', 'PROJECT', 'CLIENT', 'TAG', 'DATE', 'TASK']))
        .optional()
        .describe('Group results by these dimensions'),
});
export const startTimerSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    description: z
        .string()
        .transform(desc => desc.replace(/<[^>]*>/g, '').trim())
        .describe('Description of the time entry'),
    projectId: objectIdSchema.optional().describe('Project ID to associate with'),
    taskId: objectIdSchema.optional().describe('Task ID to associate with'),
    tagIds: z.array(objectIdSchema).optional().describe('Array of tag IDs'),
    billable: z.boolean().optional().default(false).describe('Whether the time entry is billable'),
});
export const stopTimerSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    userId: objectIdSchema.optional().describe('The user ID (defaults to current user)'),
});
export const searchProjectsSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    name: z.string().optional().describe('Search by project name'),
    clientId: objectIdSchema.optional().describe('Filter by client ID'),
    archived: z.boolean().optional().describe('Include archived projects'),
    page: z.number().optional().describe('Page number'),
    pageSize: z.number().optional().describe('Items per page'),
});
export const searchUsersSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    name: z.string().optional().describe('Search by user name'),
    email: z.string().optional().describe('Search by email'),
    status: z
        .enum(['ACTIVE', 'INACTIVE', 'PENDING_EMAIL_VERIFICATION'])
        .optional()
        .describe('Filter by status'),
});
export const createCustomFieldSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    name: z.string().describe('Custom field name'),
    type: z
        .enum(['TEXT', 'NUMBER', 'DROPDOWN_SINGLE', 'DROPDOWN_MULTIPLE', 'CHECKBOX', 'LINK'])
        .describe('Custom field type'),
    required: z.boolean().optional().default(false).describe('Whether the field is required'),
    placeholder: z.string().optional().describe('Placeholder text'),
    allowedValues: z.array(z.string()).optional().describe('Allowed values for dropdown fields'),
    onlyAdminCanEdit: z
        .boolean()
        .optional()
        .default(false)
        .describe('Whether only admins can edit this field'),
});
export const updateCustomFieldSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    customFieldId: objectIdSchema.describe('The custom field ID to update'),
    name: z.string().optional().describe('New custom field name'),
    required: z.boolean().optional().describe('New required status'),
    placeholder: z.string().optional().describe('New placeholder text'),
    allowedValues: z.array(z.string()).optional().describe('New allowed values'),
    onlyAdminCanEdit: z.boolean().optional().describe('New admin edit restriction'),
});
export const bulkTimeEntriesSchema = z.object({
    workspaceId: objectIdSchema.describe('The workspace ID'),
    timeEntryIds: z.array(objectIdSchema).min(1).max(500).describe('Array of time entry IDs (max 500)'),
    action: z.enum(['DELETE', 'UPDATE']).describe('Action to perform'),
    updates: z
        .object({
        projectId: objectIdSchema.optional(),
        taskId: objectIdSchema.optional(),
        tagIds: z.array(objectIdSchema).optional(),
        billable: z.boolean().optional(),
    })
        .optional()
        .describe('Updates to apply (for UPDATE action)'),
});
//# sourceMappingURL=schemas.js.map
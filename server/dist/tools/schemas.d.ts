import { z } from 'zod';
export declare const objectIdSchema: z.ZodString;
export declare const workspaceIdSchema: z.ZodObject<{
    workspaceId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
}, {
    workspaceId: string;
}>;
export declare const userIdSchema: z.ZodObject<{
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    userId: string;
}, {
    userId: string;
}>;
export declare const projectIdSchema: z.ZodObject<{
    projectId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    projectId: string;
}, {
    projectId: string;
}>;
export declare const clientIdSchema: z.ZodObject<{
    clientId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    clientId: string;
}, {
    clientId: string;
}>;
export declare const tagIdSchema: z.ZodObject<{
    tagId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    tagId: string;
}, {
    tagId: string;
}>;
export declare const taskIdSchema: z.ZodObject<{
    taskId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    taskId: string;
}, {
    taskId: string;
}>;
export declare const timeEntryIdSchema: z.ZodObject<{
    timeEntryId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    timeEntryId: string;
}, {
    timeEntryId: string;
}>;
export declare const dateRangeSchema: z.ZodObject<{
    start: z.ZodString;
    end: z.ZodString;
}, "strip", z.ZodTypeAny, {
    start: string;
    end: string;
}, {
    start: string;
    end: string;
}>;
export declare const paginationSchema: z.ZodObject<{
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    page?: number | undefined;
    pageSize?: number | undefined;
}, {
    page?: number | undefined;
    pageSize?: number | undefined;
}>;
export declare const createTimeEntrySchema: z.ZodObject<{
    workspaceId: z.ZodString;
    description: z.ZodEffects<z.ZodString, string, string>;
    start: z.ZodString;
    end: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    taskId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    billable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    hourlyRate: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: string;
    }, {
        amount: number;
        currency: string;
    }>>;
    costRate: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: string;
    }, {
        amount: number;
        currency: string;
    }>>;
    type: z.ZodOptional<z.ZodEnum<["REGULAR", "BREAK", "CLOCK_IN_OUT"]>>;
    kioskId: z.ZodOptional<z.ZodString>;
    customFields: z.ZodOptional<z.ZodArray<z.ZodObject<{
        customFieldId: z.ZodString;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
        sourceType: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean;
        customFieldId: string;
        name?: string | undefined;
        type?: string | undefined;
        sourceType?: string | undefined;
    }, {
        value: string | number | boolean;
        customFieldId: string;
        name?: string | undefined;
        type?: string | undefined;
        sourceType?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    start: string;
    billable: boolean;
    description: string;
    workspaceId: string;
    projectId?: string | undefined;
    taskId?: string | undefined;
    end?: string | undefined;
    tagIds?: string[] | undefined;
    hourlyRate?: {
        amount: number;
        currency: string;
    } | undefined;
    costRate?: {
        amount: number;
        currency: string;
    } | undefined;
    type?: "REGULAR" | "BREAK" | "CLOCK_IN_OUT" | undefined;
    kioskId?: string | undefined;
    customFields?: {
        value: string | number | boolean;
        customFieldId: string;
        name?: string | undefined;
        type?: string | undefined;
        sourceType?: string | undefined;
    }[] | undefined;
}, {
    start: string;
    description: string;
    workspaceId: string;
    billable?: boolean | undefined;
    projectId?: string | undefined;
    taskId?: string | undefined;
    end?: string | undefined;
    tagIds?: string[] | undefined;
    hourlyRate?: {
        amount: number;
        currency: string;
    } | undefined;
    costRate?: {
        amount: number;
        currency: string;
    } | undefined;
    type?: "REGULAR" | "BREAK" | "CLOCK_IN_OUT" | undefined;
    kioskId?: string | undefined;
    customFields?: {
        value: string | number | boolean;
        customFieldId: string;
        name?: string | undefined;
        type?: string | undefined;
        sourceType?: string | undefined;
    }[] | undefined;
}>;
export declare const updateTimeEntrySchema: z.ZodObject<{
    workspaceId: z.ZodString;
    timeEntryId: z.ZodString;
    description: z.ZodEffects<z.ZodOptional<z.ZodString>, string | undefined, string | undefined>;
    start: z.ZodOptional<z.ZodString>;
    end: z.ZodOptional<z.ZodString>;
    projectId: z.ZodOptional<z.ZodString>;
    taskId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    billable: z.ZodOptional<z.ZodBoolean>;
    hourlyRate: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: string;
    }, {
        amount: number;
        currency: string;
    }>>;
    costRate: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: string;
    }, {
        amount: number;
        currency: string;
    }>>;
    type: z.ZodOptional<z.ZodEnum<["REGULAR", "BREAK", "CLOCK_IN_OUT"]>>;
    kioskId: z.ZodOptional<z.ZodString>;
    customFields: z.ZodOptional<z.ZodArray<z.ZodObject<{
        customFieldId: z.ZodString;
        value: z.ZodUnion<[z.ZodString, z.ZodNumber, z.ZodBoolean]>;
        sourceType: z.ZodOptional<z.ZodString>;
        name: z.ZodOptional<z.ZodString>;
        type: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value: string | number | boolean;
        customFieldId: string;
        name?: string | undefined;
        type?: string | undefined;
        sourceType?: string | undefined;
    }, {
        value: string | number | boolean;
        customFieldId: string;
        name?: string | undefined;
        type?: string | undefined;
        sourceType?: string | undefined;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    timeEntryId: string;
    start?: string | undefined;
    billable?: boolean | undefined;
    description?: string | undefined;
    projectId?: string | undefined;
    taskId?: string | undefined;
    end?: string | undefined;
    tagIds?: string[] | undefined;
    hourlyRate?: {
        amount: number;
        currency: string;
    } | undefined;
    costRate?: {
        amount: number;
        currency: string;
    } | undefined;
    type?: "REGULAR" | "BREAK" | "CLOCK_IN_OUT" | undefined;
    kioskId?: string | undefined;
    customFields?: {
        value: string | number | boolean;
        customFieldId: string;
        name?: string | undefined;
        type?: string | undefined;
        sourceType?: string | undefined;
    }[] | undefined;
}, {
    workspaceId: string;
    timeEntryId: string;
    start?: string | undefined;
    billable?: boolean | undefined;
    description?: string | undefined;
    projectId?: string | undefined;
    taskId?: string | undefined;
    end?: string | undefined;
    tagIds?: string[] | undefined;
    hourlyRate?: {
        amount: number;
        currency: string;
    } | undefined;
    costRate?: {
        amount: number;
        currency: string;
    } | undefined;
    type?: "REGULAR" | "BREAK" | "CLOCK_IN_OUT" | undefined;
    kioskId?: string | undefined;
    customFields?: {
        value: string | number | boolean;
        customFieldId: string;
        name?: string | undefined;
        type?: string | undefined;
        sourceType?: string | undefined;
    }[] | undefined;
}>;
export declare const createProjectSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    name: z.ZodString;
    clientId: z.ZodOptional<z.ZodString>;
    color: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    billable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    isPublic: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    note: z.ZodOptional<z.ZodString>;
    template: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    archived: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    duration: z.ZodOptional<z.ZodString>;
    timeEstimate: z.ZodOptional<z.ZodObject<{
        estimate: z.ZodString;
        type: z.ZodString;
        resetOption: z.ZodOptional<z.ZodString>;
        active: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        estimate: string;
        resetOption?: string | undefined;
        active?: boolean | undefined;
    }, {
        type: string;
        estimate: string;
        resetOption?: string | undefined;
        active?: boolean | undefined;
    }>>;
    budgetEstimate: z.ZodOptional<z.ZodObject<{
        estimate: z.ZodNumber;
        type: z.ZodString;
        resetOption: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        type: string;
        estimate: number;
        resetOption?: string | undefined;
    }, {
        type: string;
        estimate: number;
        resetOption?: string | undefined;
    }>>;
    costRate: z.ZodOptional<z.ZodObject<{
        amount: z.ZodNumber;
        currency: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        amount: number;
        currency: string;
    }, {
        amount: number;
        currency: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    archived: boolean;
    billable: boolean;
    workspaceId: string;
    color: string;
    isPublic: boolean;
    template: boolean;
    costRate?: {
        amount: number;
        currency: string;
    } | undefined;
    clientId?: string | undefined;
    note?: string | undefined;
    duration?: string | undefined;
    timeEstimate?: {
        type: string;
        estimate: string;
        resetOption?: string | undefined;
        active?: boolean | undefined;
    } | undefined;
    budgetEstimate?: {
        type: string;
        estimate: number;
        resetOption?: string | undefined;
    } | undefined;
}, {
    name: string;
    workspaceId: string;
    archived?: boolean | undefined;
    billable?: boolean | undefined;
    costRate?: {
        amount: number;
        currency: string;
    } | undefined;
    clientId?: string | undefined;
    color?: string | undefined;
    isPublic?: boolean | undefined;
    note?: string | undefined;
    template?: boolean | undefined;
    duration?: string | undefined;
    timeEstimate?: {
        type: string;
        estimate: string;
        resetOption?: string | undefined;
        active?: boolean | undefined;
    } | undefined;
    budgetEstimate?: {
        type: string;
        estimate: number;
        resetOption?: string | undefined;
    } | undefined;
}>;
export declare const updateProjectSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    projectId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    color: z.ZodOptional<z.ZodString>;
    billable: z.ZodOptional<z.ZodBoolean>;
    isPublic: z.ZodOptional<z.ZodBoolean>;
    archived: z.ZodOptional<z.ZodBoolean>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    projectId: string;
    workspaceId: string;
    name?: string | undefined;
    archived?: boolean | undefined;
    billable?: boolean | undefined;
    clientId?: string | undefined;
    color?: string | undefined;
    isPublic?: boolean | undefined;
    note?: string | undefined;
}, {
    projectId: string;
    workspaceId: string;
    name?: string | undefined;
    archived?: boolean | undefined;
    billable?: boolean | undefined;
    clientId?: string | undefined;
    color?: string | undefined;
    isPublic?: boolean | undefined;
    note?: string | undefined;
}>;
export declare const createClientSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    name: z.ZodString;
    email: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    note: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    workspaceId: string;
    email?: string | undefined;
    note?: string | undefined;
    address?: string | undefined;
}, {
    name: string;
    workspaceId: string;
    email?: string | undefined;
    note?: string | undefined;
    address?: string | undefined;
}>;
export declare const createTagSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    name: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    workspaceId: string;
}, {
    name: string;
    workspaceId: string;
}>;
export declare const createTaskSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    projectId: z.ZodString;
    name: z.ZodString;
    assigneeIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    estimate: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodOptional<z.ZodEnum<["ACTIVE", "DONE"]>>>;
    billable: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    name: string;
    projectId: string;
    workspaceId: string;
    status: "ACTIVE" | "DONE";
    billable?: boolean | undefined;
    estimate?: string | undefined;
    assigneeIds?: string[] | undefined;
}, {
    name: string;
    projectId: string;
    workspaceId: string;
    billable?: boolean | undefined;
    status?: "ACTIVE" | "DONE" | undefined;
    estimate?: string | undefined;
    assigneeIds?: string[] | undefined;
}>;
export declare const reportRequestSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    dateRangeStart: z.ZodString;
    dateRangeEnd: z.ZodString;
    userIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    projectIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    clientIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    billable: z.ZodOptional<z.ZodEnum<["BILLABLE", "NON_BILLABLE", "BOTH"]>>;
    groupBy: z.ZodOptional<z.ZodArray<z.ZodEnum<["USER", "PROJECT", "CLIENT", "TAG", "DATE", "TASK"]>, "many">>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    billable?: "BILLABLE" | "NON_BILLABLE" | "BOTH" | undefined;
    tagIds?: string[] | undefined;
    userIds?: string[] | undefined;
    projectIds?: string[] | undefined;
    clientIds?: string[] | undefined;
    groupBy?: ("PROJECT" | "USER" | "DATE" | "TASK" | "CLIENT" | "TAG")[] | undefined;
}, {
    workspaceId: string;
    dateRangeStart: string;
    dateRangeEnd: string;
    billable?: "BILLABLE" | "NON_BILLABLE" | "BOTH" | undefined;
    tagIds?: string[] | undefined;
    userIds?: string[] | undefined;
    projectIds?: string[] | undefined;
    clientIds?: string[] | undefined;
    groupBy?: ("PROJECT" | "USER" | "DATE" | "TASK" | "CLIENT" | "TAG")[] | undefined;
}>;
export declare const startTimerSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    description: z.ZodEffects<z.ZodString, string, string>;
    projectId: z.ZodOptional<z.ZodString>;
    taskId: z.ZodOptional<z.ZodString>;
    tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    billable: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    billable: boolean;
    description: string;
    workspaceId: string;
    projectId?: string | undefined;
    taskId?: string | undefined;
    tagIds?: string[] | undefined;
}, {
    description: string;
    workspaceId: string;
    billable?: boolean | undefined;
    projectId?: string | undefined;
    taskId?: string | undefined;
    tagIds?: string[] | undefined;
}>;
export declare const stopTimerSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    userId?: string | undefined;
}, {
    workspaceId: string;
    userId?: string | undefined;
}>;
export declare const searchProjectsSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    clientId: z.ZodOptional<z.ZodString>;
    archived: z.ZodOptional<z.ZodBoolean>;
    page: z.ZodOptional<z.ZodNumber>;
    pageSize: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    name?: string | undefined;
    archived?: boolean | undefined;
    page?: number | undefined;
    clientId?: string | undefined;
    pageSize?: number | undefined;
}, {
    workspaceId: string;
    name?: string | undefined;
    archived?: boolean | undefined;
    page?: number | undefined;
    clientId?: string | undefined;
    pageSize?: number | undefined;
}>;
export declare const searchUsersSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["ACTIVE", "INACTIVE", "PENDING_EMAIL_VERIFICATION"]>>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    email?: string | undefined;
    name?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "PENDING_EMAIL_VERIFICATION" | undefined;
}, {
    workspaceId: string;
    email?: string | undefined;
    name?: string | undefined;
    status?: "ACTIVE" | "INACTIVE" | "PENDING_EMAIL_VERIFICATION" | undefined;
}>;
export declare const createCustomFieldSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["TEXT", "NUMBER", "DROPDOWN_SINGLE", "DROPDOWN_MULTIPLE", "CHECKBOX", "LINK"]>;
    required: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    placeholder: z.ZodOptional<z.ZodString>;
    allowedValues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    onlyAdminCanEdit: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    type: "TEXT" | "NUMBER" | "DROPDOWN_SINGLE" | "DROPDOWN_MULTIPLE" | "CHECKBOX" | "LINK";
    workspaceId: string;
    required: boolean;
    onlyAdminCanEdit: boolean;
    placeholder?: string | undefined;
    allowedValues?: string[] | undefined;
}, {
    name: string;
    type: "TEXT" | "NUMBER" | "DROPDOWN_SINGLE" | "DROPDOWN_MULTIPLE" | "CHECKBOX" | "LINK";
    workspaceId: string;
    required?: boolean | undefined;
    placeholder?: string | undefined;
    allowedValues?: string[] | undefined;
    onlyAdminCanEdit?: boolean | undefined;
}>;
export declare const updateCustomFieldSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    customFieldId: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    required: z.ZodOptional<z.ZodBoolean>;
    placeholder: z.ZodOptional<z.ZodString>;
    allowedValues: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    onlyAdminCanEdit: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    customFieldId: string;
    name?: string | undefined;
    required?: boolean | undefined;
    placeholder?: string | undefined;
    allowedValues?: string[] | undefined;
    onlyAdminCanEdit?: boolean | undefined;
}, {
    workspaceId: string;
    customFieldId: string;
    name?: string | undefined;
    required?: boolean | undefined;
    placeholder?: string | undefined;
    allowedValues?: string[] | undefined;
    onlyAdminCanEdit?: boolean | undefined;
}>;
export declare const bulkTimeEntriesSchema: z.ZodObject<{
    workspaceId: z.ZodString;
    timeEntryIds: z.ZodArray<z.ZodString, "many">;
    action: z.ZodEnum<["DELETE", "UPDATE"]>;
    updates: z.ZodOptional<z.ZodObject<{
        projectId: z.ZodOptional<z.ZodString>;
        taskId: z.ZodOptional<z.ZodString>;
        tagIds: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        billable: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        billable?: boolean | undefined;
        projectId?: string | undefined;
        taskId?: string | undefined;
        tagIds?: string[] | undefined;
    }, {
        billable?: boolean | undefined;
        projectId?: string | undefined;
        taskId?: string | undefined;
        tagIds?: string[] | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    workspaceId: string;
    timeEntryIds: string[];
    action: "DELETE" | "UPDATE";
    updates?: {
        billable?: boolean | undefined;
        projectId?: string | undefined;
        taskId?: string | undefined;
        tagIds?: string[] | undefined;
    } | undefined;
}, {
    workspaceId: string;
    timeEntryIds: string[];
    action: "DELETE" | "UPDATE";
    updates?: {
        billable?: boolean | undefined;
        projectId?: string | undefined;
        taskId?: string | undefined;
        tagIds?: string[] | undefined;
    } | undefined;
}>;
//# sourceMappingURL=schemas.d.ts.map
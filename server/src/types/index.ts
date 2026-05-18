import { z } from 'zod';

export interface ClockifyUser {
  id: string;
  email: string;
  name: string;
  activeWorkspace: string;
  defaultWorkspace: string;
  status: string;
  profilePicture?: string;
  settings?: {
    weekStart: string;
    timeZone: string;
    timeFormat: string;
    dateFormat: string;
  };
}

export interface ClockifyWorkspace {
  id: string;
  name: string;
  hourlyRate?: {
    amount: number;
    currency: string;
  };
  memberships?: Array<{
    userId: string;
    hourlyRate?: {
      amount: number;
      currency: string;
    };
    targetId?: string;
    membershipType: string;
    membershipStatus: string;
  }>;
  workspaceSettings?: {
    timeRoundingInReports: boolean;
    onlyAdminsSeeBillableRates: boolean;
    onlyAdminsCreateProject: boolean;
    onlyAdminsSeeDashboard: boolean;
    defaultBillableProjects: boolean;
    lockTimeEntries?: string;
    round?: {
      round: string;
      minutes: string;
    };
  };
  imageUrl?: string;
  featureSubscriptionType?: string;
}

export interface ClockifyProject {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  workspaceId: string;
  billable: boolean;
  hourlyRate?: {
    amount: number;
    currency: string;
  };
  memberships?: Array<{
    userId: string;
    hourlyRate?: {
      amount: number;
      currency: string;
    };
    targetId: string;
    membershipType: string;
    membershipStatus: string;
  }>;
  color: string;
  estimate?: {
    estimate: string;
    type: string;
  };
  archived: boolean;
  duration?: string;
  note?: string;
  template: boolean;
  public: boolean;
  costRate?: {
    amount: number;
    currency: string;
  };
  budgetEstimate?: {
    estimate: number;
    type: string;
    resetOption?: string;
  };
  timeEstimate?: {
    estimate: string;
    type: string;
    resetOption?: string;
    active: boolean;
  };
}

export interface ClockifyClient {
  id: string;
  name: string;
  workspaceId: string;
  archived: boolean;
  address?: string;
  note?: string;
  email?: string;
}

export interface ClockifyTag {
  id: string;
  name: string;
  workspaceId: string;
  archived: boolean;
}

export interface ClockifyTask {
  id: string;
  name: string;
  projectId: string;
  assigneeIds?: string[];
  assigneeId?: string;
  estimate?: string;
  status: string;
  duration?: string;
  billable?: boolean;
  hourlyRate?: {
    amount: number;
    currency: string;
  };
  costRate?: {
    amount: number;
    currency: string;
  };
}

export interface ClockifyTimeEntry {
  id: string;
  description: string;
  tagIds?: string[];
  userId: string;
  billable: boolean;
  taskId?: string;
  projectId?: string;
  timeInterval: {
    start: string;
    end?: string;
    duration?: string;
  };
  workspaceId: string;
  isLocked: boolean;
  customFieldValues?: Array<{
    customFieldId: string;
    timeEntryId?: string;
    value: string | number | boolean;
    name?: string;
    type?: string;
  }>;
  type?: string;
  kioskId?: string;
  hourlyRate?: {
    amount: number;
    currency: string;
  };
  costRate?: {
    amount: number;
    currency: string;
  };
  project?: {
    id: string;
    name: string;
    color?: string;
  };
  task?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email?: string;
  };
  tags?: Array<{
    id: string;
    name: string;
    workspaceId: string;
  }>;
}

export interface ClockifyTimeEntryRequest {
  start: string;
  billable?: boolean;
  description?: string;
  projectId?: string;
  taskId?: string;
  end?: string;
  tagIds?: string[];
  hourlyRate?: {
    amount: number;
    currency: string;
  };
  costRate?: {
    amount: number;
    currency: string;
  };
  type?: 'REGULAR' | 'BREAK' | 'CLOCK_IN_OUT';
  kioskId?: string;
  customFields?: Array<{
    customFieldId: string;
    value: string | number | boolean;
    sourceType?: string;
    name?: string;
    type?: string;
  }>;
}

export interface ClockifyCustomField {
  id: string;
  name: string;
  workspaceId: string;
  type: 'TEXT' | 'NUMBER' | 'DROPDOWN_SINGLE' | 'DROPDOWN_MULTIPLE' | 'CHECKBOX' | 'LINK';
  required: boolean;
  placeholder?: string;
  allowedValues?: string[];
  onlyAdminCanEdit: boolean;
  status: 'VISIBLE' | 'INVISIBLE';
}

export interface ClockifyCustomFieldRequest {
  name: string;
  type: 'TEXT' | 'NUMBER' | 'DROPDOWN_SINGLE' | 'DROPDOWN_MULTIPLE' | 'CHECKBOX' | 'LINK';
  required?: boolean;
  placeholder?: string;
  allowedValues?: string[];
  onlyAdminCanEdit?: boolean;
}

export interface ClockifyReportRequest {
  dateRangeStart: string;
  dateRangeEnd: string;
  summaryFilter?: {
    groups?: string[];
    sortColumn?: string;
  };
  sortOrder?: 'ASCENDING' | 'DESCENDING';
  exportType?: string;
  rounding?: boolean;
  amountShown?: 'HIDE_AMOUNT' | 'EARNED' | 'COST' | 'PROFIT';
  users?: {
    ids?: string[];
    contains?: 'CONTAINS' | 'DOES_NOT_CONTAIN';
    status?: 'ALL' | 'ACTIVE' | 'INACTIVE';
  };
  clients?: {
    ids?: string[];
    contains?: 'CONTAINS' | 'DOES_NOT_CONTAIN';
    status?: 'ALL' | 'ACTIVE' | 'ARCHIVED';
  };
  projects?: {
    ids?: string[];
    contains?: 'CONTAINS' | 'DOES_NOT_CONTAIN';
    status?: 'ALL' | 'ACTIVE' | 'ARCHIVED';
  };
  tasks?: {
    ids?: string[];
    contains?: 'CONTAINS' | 'DOES_NOT_CONTAIN';
    status?: 'ALL' | 'ACTIVE' | 'DONE';
  };
  tags?: {
    ids?: string[];
    contains?: 'CONTAINS' | 'DOES_NOT_CONTAIN';
    status?: 'ALL' | 'ACTIVE' | 'ARCHIVED';
  };
  billable?: 'BILLABLE' | 'NON_BILLABLE' | 'BOTH';
  description?: string;
  withoutDescription?: boolean;
  userGroups?: string[];
}

export interface ClockifyReportResponse {
  totals?: Array<{
    totalTime: string;
    totalBillableTime: string;
    entriesCount: number;
    totalAmount: number;
  }>;
  groupOne?: Array<{
    duration: string;
    amount?: number;
    name: string;
    _id: string;
  }>;
  groupTwo?: Array<{
    duration: string;
    amount?: number;
    name: string;
    _id: string;
    groupOne: string;
  }>;
}

export interface McpToolConfig<T = any> {
  name: string;
  description: string;
  parameters?: z.ZodSchema<T>;
  handler: (params: T) => Promise<McpResponse>;
}

export interface McpResponse {
  content: Array<{
    type: 'text' | 'resource';
    text?: string;
    resource?: any;
  }>;
}

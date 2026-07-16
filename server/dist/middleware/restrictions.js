import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';
import { resolveWorkspaceId } from '../api/workspaceResolver.js';
export class RestrictionMiddleware {
    config;
    client;
    constructor(config, client) {
        this.config = config;
        this.client = client;
    }
    checkProjectAccess(projectId) {
        if (!projectId)
            return;
        if (!this.config.isProjectAllowed(projectId)) {
            throw new McpError(ErrorCode.InvalidRequest, `Access to project ${projectId} is restricted`);
        }
    }
    checkWorkspaceAccess(workspaceId) {
        if (!workspaceId)
            return;
        if (!this.config.isWorkspaceAllowed(workspaceId)) {
            throw new McpError(ErrorCode.InvalidRequest, `Access to workspace ${workspaceId} is restricted`);
        }
    }
    checkOperation(operation) {
        if (!this.config.canPerformOperation(operation)) {
            throw new McpError(ErrorCode.InvalidRequest, `Operation '${operation}' is not allowed with current restrictions`);
        }
    }
    async applyDefaults(params) {
        const result = { ...params };
        // Apply default workspace if not specified — auto-detect via API if no env override
        if (!result.workspaceId) {
            if (this.client) {
                const allowedWorkspaces = this.config.getRestrictions().allowedWorkspaces;
                result.workspaceId = await resolveWorkspaceId(this.client, allowedWorkspaces);
            }
            else if (this.config.getDefaultWorkspaceId()) {
                result.workspaceId = this.config.getDefaultWorkspaceId();
            }
        }
        // Apply default project if not specified
        if (!result.projectId && this.config.getDefaultProjectId()) {
            result.projectId = this.config.getDefaultProjectId();
        }
        return result;
    }
    filterProjects(projects) {
        const restrictions = this.config.getRestrictions();
        if (!restrictions.allowedProjects && !restrictions.deniedProjects) {
            return projects;
        }
        return projects.filter(project => this.config.isProjectAllowed(project.id));
    }
    filterWorkspaces(workspaces) {
        const restrictions = this.config.getRestrictions();
        if (!restrictions.allowedWorkspaces) {
            return workspaces;
        }
        return workspaces.filter(workspace => this.config.isWorkspaceAllowed(workspace.id));
    }
    validateToolAccess(toolName, params) {
        // Check workspace access
        if (params.workspaceId) {
            this.checkWorkspaceAccess(params.workspaceId);
        }
        // Check project access
        if (params.projectId) {
            this.checkProjectAccess(params.projectId);
        }
        // Check operation permissions based on tool name
        const isWriteTool = toolName.startsWith('create_') ||
            toolName.startsWith('update_') ||
            toolName.startsWith('delete_') ||
            toolName === 'start_timer' ||
            toolName === 'stop_timer' ||
            toolName === 'duplicate_time_entry' ||
            toolName === 'archive_project';
        if (isWriteTool && this.config.getRestrictions().readOnly) {
            throw new McpError(ErrorCode.InvalidRequest, 'Write operations are not allowed in read-only mode');
        }
        // Specific tool checks
        switch (toolName) {
            case 'start_timer':
            case 'stop_timer':
            case 'duplicate_time_entry':
            case 'create_time_entry':
                this.checkOperation('createTimeEntry');
                break;
            case 'delete_time_entry':
            case 'bulk_edit_time_entries':
                this.checkOperation('deleteTimeEntry');
                break;
            case 'delete_project':
            case 'create_project':
            case 'update_project':
            case 'archive_project':
                this.checkOperation('manageProject');
                break;
            case 'delete_client':
            case 'create_client':
            case 'update_client':
                this.checkOperation('manageClient');
                break;
            case 'add_user_to_workspace':
            case 'remove_user_from_workspace':
            case 'update_user':
                this.checkOperation('manageUser');
                break;
        }
    }
}
//# sourceMappingURL=restrictions.js.map
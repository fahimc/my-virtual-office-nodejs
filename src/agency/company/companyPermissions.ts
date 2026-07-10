import type { ToolPermissionLevel } from '../tools/toolTypes.js';

export type CompanyRole = 'reception' | 'brief' | 'planner' | 'design' | 'copy' | 'builder' | 'qa' | 'delivery' | 'client_success' | 'ops' | 'finance';

const rolePermissions: Record<CompanyRole, ToolPermissionLevel[]> = {
  reception: ['safe', 'read', 'write'],
  brief: ['safe', 'read', 'write'],
  planner: ['safe', 'read', 'write'],
  design: ['safe', 'read', 'write'],
  copy: ['safe', 'read', 'write'],
  builder: ['safe', 'read', 'write', 'external'],
  qa: ['safe', 'read', 'write', 'external'],
  delivery: ['safe', 'read', 'write', 'external', 'dangerous'],
  client_success: ['safe', 'read', 'write', 'external'],
  ops: ['safe', 'read', 'write', 'external', 'dangerous'],
  finance: ['safe', 'read', 'write', 'external', 'dangerous']
};

export function canRoleUsePermission(role: CompanyRole, permission: ToolPermissionLevel): boolean {
  return rolePermissions[role]?.includes(permission) || false;
}

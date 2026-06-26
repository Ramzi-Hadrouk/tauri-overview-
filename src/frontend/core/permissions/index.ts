// Client-side permissions engine — extend with real RBAC when needed
export function hasPermission(_permission: string): boolean {
  void _permission;
  return true;
}

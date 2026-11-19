import type { UserRole } from "@/db/schema";

export const ROLE_RANK: Record<UserRole, number> = {
  member: 1,
  manager: 2,
  director: 3,
  admin: 4,
};

export function hasMinRole(role: UserRole, minimum: UserRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function canUpload(role: UserRole): boolean {
  return hasMinRole(role, "manager");
}

export function canManageConcerts(role: UserRole): boolean {
  return hasMinRole(role, "manager");
}

export function canPostAnnouncements(role: UserRole): boolean {
  return hasMinRole(role, "manager");
}

export function canReviewSuggestions(role: UserRole): boolean {
  return hasMinRole(role, "director");
}

export function canSetRepertoire(role: UserRole): boolean {
  return hasMinRole(role, "director");
}

export function canManageUsers(role: UserRole): boolean {
  return hasMinRole(role, "admin");
}

export function canManageSettings(role: UserRole): boolean {
  return hasMinRole(role, "admin");
}

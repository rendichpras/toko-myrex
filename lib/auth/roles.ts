export function hasUserRole(
  assignedRoles: string | null | undefined,
  expectedRole: string
) {
  return (
    assignedRoles
      ?.split(",")
      .some((role) => role.trim() === expectedRole) ?? false
  )
}

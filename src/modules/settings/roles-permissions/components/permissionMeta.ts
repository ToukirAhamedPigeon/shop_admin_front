// src/modules/settings/roles-permissions/components/permissionMeta.ts

/**
 * Permission names follow "<action>-<scope>-<module>", e.g. "read-admin-users"
 * or "read-admin-mail-templates". Anything else is kept whole as its module.
 */
export function parsePermission(name: string): { action: string; module: string } {
  const parts = name.split('-')
  if (parts.length >= 3) return { action: parts[0], module: parts.slice(2).join('-') }
  if (parts.length === 2) return { action: parts[0], module: parts[1] }
  return { action: name, module: 'other' }
}

/** Permissions grouped by module, biggest groups first. */
export function groupPermissions(names: string[] = []): { module: string; actions: string[] }[] {
  const map = new Map<string, string[]>()
  for (const name of names) {
    const { action, module } = parsePermission(name)
    const list = map.get(module) ?? []
    list.push(action)
    map.set(module, list)
  }
  return [...map.entries()]
    .map(([module, actions]) => ({ module, actions: actions.sort() }))
    .sort((a, b) => b.actions.length - a.actions.length || a.module.localeCompare(b.module))
}

/** "mail-templates" → "Mail templates". */
export const moduleLabel = (module: string) => module.replace(/[-_]+/g, ' ').replace(/^\w/, (c) => c.toUpperCase())

/** "Admin = Editor=Viewer" → ["Admin", "Editor", "Viewer"]: the API creates one per name. */
export const splitNames = (raw: string) => [...new Set(raw.split('=').map((s) => s.trim()).filter(Boolean))]

/** Which of the chosen groups give each permission: { "read-admin-mails": ["Mail manager"] }. Inactive groups give nothing. */
export function inheritedFromGroups(
  groups: { name: string; isActive: boolean; permissions: string[] }[],
  chosen: string[]
): Record<string, string[]> {
  const out: Record<string, string[]> = {}
  for (const g of groups) {
    if (!g.isActive || !chosen.includes(g.name)) continue
    for (const p of g.permissions) (out[p] ??= []).push(g.name)
  }
  return out
}

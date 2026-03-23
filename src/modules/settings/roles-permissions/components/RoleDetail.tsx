import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCustomDateTime } from '@/lib/formatDate'
import type { IRole } from '@/types/role-permission'

export default function RoleDetail({ role, onUpdated }: { role: IRole; onUpdated?: () => void }) {
  const rows = [
    ['Name', role.name],
    ['Guard Name', role.guardName],
    ['Permissions', role.permissions?.join(', ') || '-'],
    ['Active', role.isActive ? 'Yes' : 'No'],
    ['Deleted', role.isDeleted ? 'Yes' : 'No'],
    ['Created At', getCustomDateTime(role.createdAt)],
    ['Updated At', getCustomDateTime(role.updatedAt)],
  ]

  return (
    <Table>
      <TableBody>
        {rows.map(([label, value]) => (
          <TableRow key={label}>
            <TableCell className="font-semibold w-40">{label}</TableCell>
            <TableCell>{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
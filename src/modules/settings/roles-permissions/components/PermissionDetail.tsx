import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCustomDateTime } from '@/lib/formatDate'
import type { IPermission } from '@/types/role-permission'

export default function PermissionDetail({ permission, onUpdated }: { permission: IPermission; onUpdated?: () => void }) {
  const rows = [
    ['Name', permission.name],
    ['Guard Name', permission.guardName],
    ['Roles', permission.roles?.join(', ') || '-'],
    ['Active', permission.isActive ? 'Yes' : 'No'],
    ['Deleted', permission.isDeleted ? 'Yes' : 'No'],
    ['Created At', getCustomDateTime(permission.createdAt)],
    ['Updated At', getCustomDateTime(permission.updatedAt)],
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
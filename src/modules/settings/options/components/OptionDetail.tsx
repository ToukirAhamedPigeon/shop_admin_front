import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { getCustomDateTime } from '@/lib/formatDate';
import type { IOption } from '@/types/option';

export default function OptionDetail({ option }: { option: IOption }) {
  const rows = [
    ['Name', option.name],
    ['Parent', option.parentName || '-'],
    ['Has Child', option.hasChild ? 'Yes' : 'No'],
    ['Active', option.isActive ? 'Yes' : 'No'],
    ['Deleted', option.isDeleted ? 'Yes' : 'No'],
    ['Created At', getCustomDateTime(option.createdAt)],
    ['Updated At', getCustomDateTime(option.updatedAt)],
    ['Created By', option.createdByName || '-'],
    ['Updated By', option.updatedByName || '-'],
    ['Deleted By', option.deletedByName || '-'],
  ];

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
  );
}
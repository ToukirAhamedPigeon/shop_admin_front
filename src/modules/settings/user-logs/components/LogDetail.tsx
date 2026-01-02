import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useTranslations } from '@/hooks/useTranslations';
import { getCustomDateTime } from '@/lib/formatDate';

interface LogDetailProps {
  log: {
    detail: string;
    collectionName: string;
    actionType: string;
    objectId: string;
    createdByName: string;
    createdAt: string;
    ipAddress?: string | null;
    browser?: string | null;
    device?: string | null;
    operatingSystem?: string | null;
    userAgent?: string | null;
    changes?: Record<string, any> | null;
  };
}

export default function LogDetail({ log }: { log: LogDetailProps['log'] }) {
  const { t } = useTranslations();

  // Format changes if exists
  const changeRows = log.changes
    ? Object.entries(log.changes).map(([key, value]) => ({
        label: key,
        value: typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value),
      }))
    : [];

  // Main log rows
  const rows = [
    { label: 'Detail', value: log.detail ?? 'No detail provided' },
    { label: 'Collection Name', value: log.collectionName ?? '-' },
    { label: 'Action Type', value: log.actionType ?? '-' },
    { label: 'Object ID', value: log.objectId ?? '-' },
    { label: 'Created By', value: log.createdByName ?? '-' },
    { label: 'Created At', value: getCustomDateTime(log.createdAt, 'YYYY-MM-DD HH:mm:ss') },
    { label: 'IP Address', value: log.ipAddress ?? '-' },
    { label: 'Browser', value: log.browser ?? '-' },
    { label: 'Device', value: log.device ?? '-' },
    { label: 'Operating System', value: log.operatingSystem ?? '-' },
    { label: 'User Agent', value: log.userAgent ?? '-' },
    ...(changeRows.length > 0
      ? [{ label: 'Changes', value: <ChangeTable changes={changeRows} /> }]
      : []),
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 px-4 md:px-6 py-6 max-w-7xl mx-auto dark:bg-gray-800">
      <div className="flex-1">
        <Table>
          <TableBody>
            {rows.map(({ label, value }, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-semibold w-44 align-top">{t(label)}:</TableCell>
                <TableCell>{value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ChangeTable({ changes }: { changes: { label: string; value: string }[] }) {
  return (
    <div className="space-y-2">
      {changes.map(({ label, value }, idx) => (
        <div key={idx} className="bg-gray-50 p-2 rounded dark:bg-gray-700">
          <span className="font-medium">{label}:</span>
          <pre className="whitespace-pre-wrap break-words mt-1">{value}</pre>
        </div>
      ))}
    </div>
  );
}

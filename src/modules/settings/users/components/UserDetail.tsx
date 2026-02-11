import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCustomDateTime, getPassedTime } from '@/lib/formatDate'
import { generateQRImage } from '@/lib/generateQRImage'
import { useEffect, useState } from 'react'
import Fancybox from '@/components/custom/FancyBox'
import { capitalize } from '@/lib/helpers'

export default function UserDetail({ user }: { user: any }) {
   const [qrImg, setQrImg] = useState<string | null>(null)

  useEffect(() => {
    if (user.qrCode) {
      generateQRImage(user.qrCode).then(setQrImg)
    }
  }, [user.qrCode])
  const rows = [
    [
      'Profile Image',
      <Fancybox
        src={(user?.profileImage)?import.meta.env.VITE_API_BASE_URL + user.profileImage || '/human.png': '/human.png'}
        alt="Profile Image"
        title={user.name}
        description={`${user.email}\n${user.mobileNo ?? ''}`}
        className="w-20 h-20 rounded-full object-cover"
      />,
    ],
    [
      'QR Code',
      user.qrCode && qrImg ? (
        <div className="flex flex-col items-start gap-2">
          <Fancybox
            src={qrImg}
            alt="QR Code"
            title={user.name}
            description={`${user.email}\n${user.mobileNo ?? ''}`}
            isQRCode
            className="w-28 h-28"
          />
          <span className="text-xs text-gray-900 dark:text-gray-300 break-all max-w-[200px]">
            {user.qrCode}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      ),
    ],
    ['Name', user.name],
    ['Username', user.username],
    ['Email', user.email],
    ['Mobile', user.mobileNo ?? '-'],
    ['NID', user.nid ?? '-'],
    ['Gender', (user.gender!=null)?capitalize(user.gender):'-'],
    ['Date of Birth', user.dateOfBirth ? (
      <>
        {getCustomDateTime(user.dateOfBirth, 'YYYY-MM-DD')}
        <br />
        <small>
          ({getPassedTime(getCustomDateTime(user.dateOfBirth, 'YYYY-MM-DD') as string)})
        </small>
      </>
    ) : '-'],
    ['Address', user.address ?? '-'],
    ['Bio', user.bio ?? '-'],
    ['Timezone', user.timezone ?? '-'],
    ['Language', user.language ?? '-'],
    ['Active', user.isActive ? 'Yes' : 'No'],
    ['Roles', user.roles?.join(', ') || '-'],
    ['Permissions', user.permissions?.join(', ') || '-'],
    ['Created By', user.createdByName ?? '-'],
    ['Updated By', user.updatedByName ?? '-'],
    ['Created At', getCustomDateTime(user.createdAt)],
    ['Updated At', getCustomDateTime(user.updatedAt)],
    
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
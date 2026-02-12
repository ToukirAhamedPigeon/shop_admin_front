import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCustomDateTime, getPassedTime } from '@/lib/formatDate'
import { generateQRImage } from '@/lib/generateQRImage'
import { useEffect, useState } from 'react'
import Fancybox from '@/components/custom/FancyBox'
import { capitalize } from '@/lib/helpers'
import { resendVerification } from '@/modules/auth/api'
import { dispatchShowToast } from '@/lib/dispatch'
import { can } from '@/lib/authCheck'
import { Loader2, Mail } from 'lucide-react'


export default function UserDetail({ user }: { user: any }) {
   const [qrImg, setQrImg] = useState<string | null>(null)
   const [loading, setLoading] = useState(false)

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
    [
      'Email Verification',
      user.emailVerifiedAt ? (
        <span className="text-green-600 font-semibold">Verified <small className="text-xs text-gray-700 dark:text-gray-200">at {getCustomDateTime(user.emailVerifiedAt, 'YYYY-MM-DD HH:mm:ss')}</small></span>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-red-500 font-semibold">Not Verified</span>

          {can(['read-admin-dashboard']) && (
            <button
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true)
                  const res = await resendVerification(user.id)

                  dispatchShowToast({
                    type: "success",
                    message: res.data,
                  })
                } catch (err: any) {
                  dispatchShowToast({
                    type: "danger",
                    message: err.response?.data || "Failed to resend email",
                  })
                } finally {
                  setLoading(false)
                }
              }}
              className={`
                group inline-flex items-center gap-2
                px-3 py-1.5
                rounded-lg
                cursor-pointer
                text-sm font-medium
                transition-all duration-200 ease-in-out
                bg-emerald-600
                hover:bg-emerald-700
                text-white
                shadow-sm hover:shadow
                focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1
                active:scale-[0.98]
                disabled:opacity-60 disabled:cursor-not-allowed
              `}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 transition-transform group-hover:rotate-12" />
                  Resend Verification Email
                </>
              )}
            </button>
          )}
        </div>
      ),
    ],
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
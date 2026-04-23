// app/(dashboard)/admin/users/UserDetail.tsx

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { getCustomDateTime, getPassedTime } from '@/lib/formatDate'
import { generateQRImage } from '@/lib/generateQRImage'
import { useEffect, useState } from 'react'
import Fancybox from '@/components/custom/FancyBox'
import { capitalize } from '@/lib/helpers'
import { resendVerification } from '@/modules/auth/api'
import { dispatchShowToast } from '@/lib/dispatch'
import { can } from '@/lib/authCheck'
import { Loader2, Mail, RefreshCw } from 'lucide-react'
import { regenerateQr } from '../api'

export default function UserDetail({ user, onUpdated }: { user: any; onUpdated?: () => void }) {
  const [qrImg, setQrImg] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState<string | null>(null)

  // Check if user is deleted
  const isDeleted = user?.isDeleted === true

  useEffect(() => {
    if (user.qrCode && !isDeleted) {
      generateQRImage(user.qrCode).then(setQrImg).catch(err => {
        console.error("Failed to generate QR image:", err);
        setQrError("Failed to generate QR code");
      });
    }
  }, [user.qrCode, isDeleted])

  const handleRegenerateQR = async () => {
    if (!user?.id) {
      dispatchShowToast({
        type: "danger",
        message: "User ID is missing",
      })
      return
    }

    if (isDeleted) {
      dispatchShowToast({
        type: "danger",
        message: "Cannot regenerate QR code for a deleted user",
      })
      return
    }

    setQrLoading(true)
    setQrError(null)
    
    try {
      const response = await regenerateQr(user.id)
      
      // Check if response is valid
      if (response && response.data) {
        const newQrCode = response.data.qrCode || response.data
        
        // Update QR image
        if (newQrCode) {
          const newQrImg = await generateQRImage(newQrCode)
          setQrImg(newQrImg)
          
          // Update local user object
          user.qrCode = newQrCode
        }
        
        dispatchShowToast({
          type: "success",
          message: response.data.message || "QR Code regenerated successfully",
        })
        
        // Call onUpdated to refresh parent data
        if (onUpdated) {
          await onUpdated()
        }
      } else {
        throw new Error("Invalid response from server")
      }
    } catch (err: any) {
      console.error("Regenerate QR error:", err)
      
      // Handle different error types
      let errorMessage = "Failed to regenerate QR code"
      
      if (err.response) {
        // Server responded with error status
        switch (err.response.status) {
          case 401:
            errorMessage = "Unauthorized. Please login again."
            break
          case 404:
            errorMessage = "User not found. The user may have been deleted."
            break
          case 403:
            errorMessage = "You don't have permission to perform this action."
            break
          default:
            errorMessage = err.response.data?.message || err.response.data || errorMessage
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your connection."
      } else {
        errorMessage = err.message || errorMessage
      }
      
      dispatchShowToast({
        type: "danger",
        message: errorMessage,
      })
    } finally {
      setQrLoading(false)
    }
  }

  const rows = [
    [
      'Profile Image',
      <Fancybox
        src={(user?.profileImage) ? import.meta.env.VITE_API_ASSET_URL + user.profileImage : '/human.png'}
        alt="Profile Image"
        title={user.name}
        description={`${user.email}\n${user.mobileNo ?? ''}`}
        className="w-20 h-20 rounded-full object-cover"
      />,
    ],
    [
      'QR Code',
      <div className="flex flex-col items-start gap-2">
        {isDeleted ? (
          <span className="text-gray-400 italic">Not available for deleted users</span>
        ) : qrError ? (
          <span className="text-red-500 text-sm">{qrError}</span>
        ) : user.qrCode && qrImg ? (
          <>
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
          </>
        ) : (
          <span className="text-gray-400">No QR Code</span>
        )}

        {/* 🔥 QR Regenerate Button - Hidden when user is deleted */}
        {!isDeleted && can(['update-admin-users']) && (
          <button
            disabled={qrLoading}
            onClick={handleRegenerateQR}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {qrLoading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3" />
                {user.qrCode ? "Regenerate QR" : "Generate QR"}
              </>
            )}
          </button>
        )}
      </div>,
    ],
    ['Name', user.name],
    ['Username', user.username],
    ['Email', user.email],
    [
      'Email Verification',
      isDeleted ? (
        <span className="text-gray-400 italic">Not available for deleted users</span>
      ) : user.emailVerifiedAt ? (
        <span className="text-green-600 font-semibold">
          Verified 
          <small className="text-xs text-gray-700 dark:text-gray-200 ml-1">
            at {getCustomDateTime(user.emailVerifiedAt, 'YYYY-MM-DD HH:mm:ss')}
          </small>
        </span>
      ) : (
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-red-500 font-semibold">Not Verified</span>

          {!isDeleted && can(['update-admin-users']) && (
            <button
              disabled={loading}
              onClick={async () => {
                try {
                  setLoading(true)
                  const res = await resendVerification(user.id)
                  dispatchShowToast({
                    type: "success",
                    message: res.data || "Verification email sent successfully",
                  })
                } catch (err: any) {
                  let errorMessage = "Failed to resend verification email"
                  if (err.response?.status === 401) {
                    errorMessage = "Unauthorized. Please login again."
                  } else if (err.response?.status === 404) {
                    errorMessage = "User not found."
                  } else {
                    errorMessage = err.response?.data || errorMessage
                  }
                  dispatchShowToast({
                    type: "danger",
                    message: errorMessage,
                  })
                } finally {
                  setLoading(false)
                }
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
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
    ['Gender', (user.gender != null) ? capitalize(user.gender) : '-'],
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
    ['Deleted', isDeleted ? <span className="text-red-500 font-semibold">Yes</span> : 'No'],
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
          <TableRow key={label as string}>
            <TableCell className="font-semibold w-40">{label as string}</TableCell>
            <TableCell>{value}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
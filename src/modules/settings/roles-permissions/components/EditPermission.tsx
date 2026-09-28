// src/modules/settings/roles-permissions/components/EditPermission.tsx
import AccessForm from './AccessForm'

export default function EditPermission({ permissionId, fetchData, onClose }: { permissionId: string; fetchData: () => Promise<void>; onClose: () => void }) {
  return <AccessForm kind="permission" id={permissionId} fetchData={fetchData} onClose={onClose} />
}

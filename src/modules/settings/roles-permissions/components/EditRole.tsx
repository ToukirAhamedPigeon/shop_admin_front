// src/modules/settings/roles-permissions/components/EditRole.tsx
import AccessForm from './AccessForm'

export default function EditRole({ roleId, fetchData, onClose }: { roleId: string; fetchData: () => Promise<void>; onClose: () => void }) {
  return <AccessForm kind="role" id={roleId} fetchData={fetchData} onClose={onClose} />
}

// src/modules/settings/roles-permissions/components/AddPermission.tsx
import AccessForm from './AccessForm'

export default function AddPermission({ fetchData, onClose }: { fetchData: () => Promise<void>; onClose: () => void }) {
  return <AccessForm kind="permission" fetchData={fetchData} onClose={onClose} />
}

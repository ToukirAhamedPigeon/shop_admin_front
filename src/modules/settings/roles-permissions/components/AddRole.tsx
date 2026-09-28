// src/modules/settings/roles-permissions/components/AddRole.tsx
import AccessForm from './AccessForm'

export default function AddRole({ fetchData, onClose }: { fetchData: () => Promise<void>; onClose: () => void }) {
  return <AccessForm kind="role" fetchData={fetchData} onClose={onClose} />
}

// src/modules/settings/users/components/Edit.tsx
import UserForm from './UserForm'

interface Props {
  userId: string
  fetchData: () => Promise<void>
  onClose: () => void
}

export default function Edit({ userId, fetchData, onClose }: Props) {
  return <UserForm mode="edit" userId={userId} fetchData={fetchData} onClose={onClose} />
}

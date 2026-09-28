// src/modules/settings/users/components/Add.tsx
import UserForm from './UserForm'

export default function Add({ fetchData }: { fetchData: () => Promise<void> }) {
  return <UserForm mode="add" fetchData={fetchData} />
}

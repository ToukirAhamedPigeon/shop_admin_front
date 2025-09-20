import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export default function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const csrfToken = useSelector((state: RootState) => state.auth.csrfToken);
  return (
    <div className="w-full p-0  bg-gradient-to-br from-white-100 via-sky-100 to-orange-100 space-y-8 rounded-3xl">
       <h2 className="text-2xl font-bold mb-4">Welcome to Dashboard</h2>
        <p className="text-gray-700 dark:text-gray-300">Use this space for admin statistics, charts, etc.</p>
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">User Info</h3>
          <table className="min-w-full border rounded">
            <tbody>
              <tr>
                <td className="border px-4 py-2 font-medium">Email</td>
                <td className="border px-4 py-2">{user?.email}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">ID</td>
                <td className="border px-4 py-2">{user?.id}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Mobile No</td>
                <td className="border px-4 py-2">{user?.mobileNo}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Username</td>
                <td className="border px-4 py-2">{user?.username}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Roles</td>
                <td className="border px-4 py-2">{user?.roles?.join(", ")}</td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Permissions</td>
                <td className="border px-4 py-2">
                  {user?.permissions?.join(", ")}
                </td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">Access Token</td>
                <td className="border px-4 py-2">
                  {accessToken ? (
                    <span className="break-all">{accessToken}</span> 
                  ) : (
                    <span className="text-gray-500">No Access Token</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="border px-4 py-2 font-medium">CSRF Token</td>
                <td className="border px-4 py-2">
                  {csrfToken ? (
                    <span className="break-all">{csrfToken}</span> 
                  ) : (
                    <span className="text-gray-500">No CSRF Token</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
    </div>
  )
}

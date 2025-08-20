import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import AdminLayout from "../layouts/AdminLayout";

export default function DashboardPage() {
  const user = useSelector((state: RootState) => state.auth.user);
  console.log("DashboardPage user:", user);
  return (
    <AdminLayout>
        <h2 className="text-2xl font-bold mb-4">Welcome to Dashboard</h2>
        <p>Use this space for admin statistics, charts, etc.</p>

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
            </tbody>
          </table>
        </div>
    </AdminLayout>
  );
}

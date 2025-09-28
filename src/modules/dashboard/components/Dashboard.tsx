import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

export default function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const csrfToken = useSelector((state: RootState) => state.auth.csrfToken);

  return (
    <div className="w-full p-6 bg-gradient-to-br from-white-100 via-sky-100 to-orange-100 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 space-y-8 rounded-3xl transition-colors duration-500">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Welcome to Dashboard
      </h2>
      <p className="text-gray-700 dark:text-gray-300">
        Use this space for admin statistics, charts, etc.
      </p>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-gray-100">
          User Info
        </h3>
        <table className="min-w-full border rounded border-gray-300 dark:border-gray-700 overflow-hidden">
          <tbody>
            {[
              ["Email", user?.email],
              ["ID", user?.id],
              ["Mobile No", user?.mobileNo],
              ["Username", user?.username],
              ["Roles", user?.roles?.join(", ")],
              ["Permissions", user?.permissions?.join(", ")],
              ["Access Token", accessToken || "No Access Token"],
              ["CSRF Token", csrfToken || "No CSRF Token"],
            ].map(([label, value], idx) => (
              <tr key={idx} className="even:bg-gray-50 dark:even:bg-gray-700/30">
                <td className="border px-4 py-2 font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </td>
                <td className="border px-4 py-2 text-gray-800 dark:text-gray-100 break-all">
                  {value ? value : <span className="text-gray-500 dark:text-gray-400">{value}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

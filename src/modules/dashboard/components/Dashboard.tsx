// src/modules/dashboard/components/Dashboard.tsx
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { motion } from "framer-motion";
import GlassCard from "@/components/custom/GlassCard";
import DashboardCard from "./DashboardCard";
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp,
  Mail,
  Star,
  Trash2,
  Activity,
  Shield,
  Key,
  UserCheck
} from "lucide-react";

export default function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.user);
  const accessToken = useSelector((state: RootState) => state.auth.accessToken);
  const csrfToken = useSelector((state: RootState) => state.auth.csrfToken);

  // Sample statistics data (replace with real data from API)
  const stats = [
    {
      title: "Total Users",
      value: user?.id ? "1,234" : "0",
      icon: <Users className="w-6 h-6 text-blue-500" />,
      trend: { value: 12, isPositive: true },
      variant: "primary" as const,
    },
    {
      title: "Total Orders",
      value: "856",
      icon: <ShoppingBag className="w-6 h-6 text-emerald-500" />,
      trend: { value: 8, isPositive: true },
      variant: "accent" as const,
    },
    {
      title: "Revenue",
      value: "$12,426",
      icon: <DollarSign className="w-6 h-6 text-amber-500" />,
      trend: { value: 23, isPositive: true },
      variant: "secondary" as const,
    },
    {
      title: "Active Sessions",
      value: "42",
      icon: <Activity className="w-6 h-6 text-purple-500" />,
      trend: { value: 5, isPositive: false },
      variant: "default" as const,
    },
  ];

  const quickStats = [
    { label: "Total Emails", value: "156", icon: <Mail className="w-4 h-4" />, color: "text-blue-500" },
    { label: "Starred", value: "23", icon: <Star className="w-4 h-4" />, color: "text-yellow-500" },
    { label: "Trash", value: "12", icon: <Trash2 className="w-4 h-4" />, color: "text-red-500" },
    { label: "Unread", value: "8", icon: <TrendingUp className="w-4 h-4" />, color: "text-green-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard variant="primary" padding="lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 bg-clip-text text-transparent">
                Welcome back, {user?.name?.split(" ")[0] || "Admin"}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Here's what's happening with your store today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                System Online
              </div>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Statistics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, index) => (
          <DashboardCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            variant={stat.variant}
            delay={index * 0.1}
          />
        ))}
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <GlassCard variant="default" padding="md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            Quick Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5"
              >
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <p className="text-xl font-bold mt-1 text-gray-800 dark:text-gray-100">
                    {stat.value}
                  </p>
                </div>
                <div className={stat.color}>{stat.icon}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* User Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <GlassCard variant="secondary" padding="md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
            User Information
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {[
                  ["Email", user?.email],
                  ["User ID", user?.id],
                  ["Mobile Number", user?.mobileNo],
                  ["Username", user?.username],
                  ["Roles", user?.roles?.join(", ")],
                  ["Permissions", `${user?.permissions?.length || 0} permissions assigned`],
                ].map(([label, value], idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-200/50 dark:border-gray-700/50 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 w-32">
                      {label}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-100 break-all">
                      {value ? (
                        value
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">Not provided</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>

      {/* Token Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <GlassCard variant="primary" padding="md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-blue-100/50 dark:bg-blue-900/30">
                <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                Access Token
              </h3>
            </div>
            <p className="text-xs font-mono break-all bg-black/5 dark:bg-white/5 p-3 rounded-lg text-gray-700 dark:text-gray-300">
              {accessToken || "No Access Token Available"}
            </p>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <GlassCard variant="secondary" padding="md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-purple-100/50 dark:bg-purple-900/30">
                <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">
                CSRF Token
              </h3>
            </div>
            <p className="text-xs font-mono break-all bg-black/5 dark:bg-white/5 p-3 rounded-lg text-gray-700 dark:text-gray-300">
              {csrfToken || "No CSRF Token Available"}
            </p>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
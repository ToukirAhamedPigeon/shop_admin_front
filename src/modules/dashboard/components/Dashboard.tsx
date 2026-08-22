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
} from "lucide-react";

export default function Dashboard() {
  const user = useSelector((state: RootState) => state.auth.user);

  // Sample statistics data (replace with real data once Ecommerce/Sales modules exist)
  const stats = [
    {
      title: "Total Users",
      value: user?.id ? "1,234" : "0",
      icon: <Users className="w-5 h-5" />,
      trend: { value: 12, isPositive: true },
    },
    {
      title: "Total Orders",
      value: "856",
      icon: <ShoppingBag className="w-5 h-5" />,
      trend: { value: 8, isPositive: true },
    },
    {
      title: "Revenue",
      value: "$12,426",
      icon: <DollarSign className="w-5 h-5" />,
      trend: { value: 23, isPositive: true },
    },
    {
      title: "Active Sessions",
      value: "42",
      icon: <Activity className="w-5 h-5" />,
      trend: { value: 5, isPositive: false },
    },
  ];

  const quickStats = [
    { label: "Total Emails", value: "156", icon: <Mail className="w-4 h-4" /> },
    { label: "Starred", value: "23", icon: <Star className="w-4 h-4" /> },
    { label: "Trash", value: "12", icon: <Trash2 className="w-4 h-4" /> },
    { label: "Unread", value: "8", icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <GlassCard variant="primary" padding="lg" hoverEffect={false}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome back, {user?.name?.split(" ")[0] || "Admin"}
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your store today.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
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
            delay={index * 0.08}
          />
        ))}
      </div>

      {/* Quick Stats Row */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <GlassCard variant="default" padding="md" hoverEffect={false}>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Quick Overview
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold mt-1 text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className="text-muted-foreground">{stat.icon}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* User Information Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
      >
        <GlassCard variant="default" padding="md" hoverEffect={false}>
          <h3 className="text-lg font-semibold mb-4 text-foreground">
            Account
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <tbody>
                {[
                  ["Email", user?.email],
                  ["Username", user?.username],
                  ["Mobile Number", user?.mobileNo],
                  ["Roles", user?.roles?.join(", ")],
                ].map(([label, value], idx) => (
                  <tr
                    key={idx}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-muted-foreground w-32">
                      {label}
                    </td>
                    <td className="px-4 py-3 text-foreground break-all">
                      {value ?? <span className="text-muted-foreground">Not provided</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}

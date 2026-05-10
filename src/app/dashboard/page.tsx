"use client";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { BookOpen, DollarSign, Home, Users } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchBookings, fetchPropertyStats, fetchUserStats } from ".././service";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function StatCard({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  sub?: string;
}) {
  return (
    <div className={`rounded-2xl p-5 text-white shadow-md flex items-center gap-4 ${color}`}>
      <div className="bg-white/20 rounded-xl p-3">{icon}</div>
      <div>
        <p className="text-sm opacity-80">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs opacity-70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [totalProperties, setTotalProperties] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [totalBookings, setTotalBookings] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [monthlyBookings, setMonthlyBookings] = useState<{ month: string; bookings: number }[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<{ month: string; revenue: number }[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  useEffect(() => {
    async function loadStats() {
      const [{ totalProperties }, { totalUsers }, bookings] = await Promise.all([
        fetchPropertyStats(),
        fetchUserStats(),
        fetchBookings(),
      ]);

      const paid = bookings.filter(
        (b: any) => b.billingMethod !== "external" && b.paymentStatus !== "Refunded"
      );

      const earnings = paid.reduce((s: number, b: any) => s + (b.paid || 0), 0);

      // Build monthly aggregates for current year
      const year = new Date().getFullYear();
      const bookingsByMonth = Array(12).fill(0);
      const revenueByMonth = Array(12).fill(0);

      paid.forEach((b: any) => {
        const ts = b.createdAt?.toDate?.() ?? (b.createdAt ? new Date(b.createdAt) : null);
        if (ts && ts.getFullYear() === year) {
          const m = ts.getMonth();
          bookingsByMonth[m]++;
          revenueByMonth[m] += b.paid || 0;
        }
      });

      setMonthlyBookings(MONTHS.map((m, i) => ({ month: m, bookings: bookingsByMonth[i] })));
      setMonthlyRevenue(MONTHS.map((m, i) => ({ month: m, revenue: Math.round(revenueByMonth[i]) })));

      // Recent 5 bookings
      const sorted = [...paid].sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return tb - ta;
      });
      setRecentBookings(sorted.slice(0, 5));

      setTotalProperties(totalProperties);
      setTotalUsers(totalUsers);
      setTotalBookings(paid.length);
      setTotalEarnings(Math.round(earnings * 100) / 100);
      setLoading(false);
    }
    loadStats();
  }, []);

  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email || "");
    });
    return () => unsub();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  return (
    <div className="p-4 md:p-8 space-y-8 md:mt-0 mt-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {userEmail && <p className="text-sm text-gray-400 mt-1">Logged in as {userEmail}</p>}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Properties"
          value={totalProperties}
          icon={<Home size={22} />}
          color="bg-blue-600"
        />
        <StatCard
          label="Total Users"
          value={totalUsers}
          icon={<Users size={22} />}
          color="bg-indigo-500"
        />
        <StatCard
          label="Total Bookings"
          value={totalBookings}
          icon={<BookOpen size={22} />}
          color="bg-purple-500"
        />
        <StatCard
          label="Total Revenue"
          value={`${totalEarnings.toLocaleString()} LYD`}
          icon={<DollarSign size={22} />}
          color="bg-emerald-500"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Monthly Bookings ({new Date().getFullYear()})</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyBookings} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4">Monthly Revenue ({new Date().getFullYear()}) — LYD</h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={monthlyRevenue} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Recent Bookings</h2>
        {recentBookings.length === 0 ? (
          <p className="text-sm text-gray-400">No bookings yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-400 border-b text-xs uppercase tracking-wide">
                  <th className="pb-3 pr-4">Guest</th>
                  <th className="pb-3 pr-4">Property</th>
                  <th className="pb-3 pr-4">Amount</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition">
                    <td className="py-3 pr-4 font-medium text-gray-800">
                      {b.guestName || b.guestId || "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 truncate max-w-[180px]">
                      {b.propertyTitle || b.propertyId || "—"}
                    </td>
                    <td className="py-3 pr-4 font-semibold text-blue-600">
                      {b.paid ?? b.totalPrice ?? 0} LYD
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          b.paymentStatus === "Paid"
                            ? "bg-green-100 text-green-700"
                            : b.paymentStatus === "Refunded"
                            ? "bg-red-100 text-red-600"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {b.paymentStatus || "Pending"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

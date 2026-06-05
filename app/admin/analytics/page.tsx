'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/dashboard/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Briefcase, DollarSign, TrendingUp } from 'lucide-react';

const PIE_COLORS = ['hsl(245,100%,67%)', 'hsl(193,100%,42%)', 'hsl(142,71%,45%)'];

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState({
    totalUsers: 0, students: 0, providers: 0,
    totalServices: 0, approvedServices: 0,
    totalBookings: 0, completedBookings: 0,
    totalRevenue: 0,
  });
  const [categoryData, setCategoryData] = useState<{ name: string; value: number }[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ month: string; bookings: number; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [profilesRes, servicesRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('role'),
        supabase.from('services').select('status, category'),
        supabase.from('bookings').select('status, amount, created_at'),
      ]);

      const profiles: { role: string }[] = profilesRes.data || [];
      const services: { status: string; category: string }[] = servicesRes.data || [];
      const bookings: { status: string; amount: number; created_at: string }[] = bookingsRes.data || [];
      const completed = bookings.filter((b) => b.status === 'completed');

      setStats({
        totalUsers: profiles.length,
        students: profiles.filter((p) => p.role === 'student').length,
        providers: profiles.filter((p) => p.role === 'provider').length,
        totalServices: services.length,
        approvedServices: services.filter((s) => s.status === 'approved').length,
        totalBookings: bookings.length,
        completedBookings: completed.length,
        totalRevenue: completed.reduce((s, b) => s + Number(b.amount), 0),
      });

      const catCounts: Record<string, number> = {};
      services.forEach((s) => { catCounts[s.category] = (catCounts[s.category] || 0) + 1; });
      setCategoryData(Object.entries(catCounts).map(([name, value]) => ({ name, value })));

      const months: Record<string, { bookings: number; revenue: number }> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months[d.toLocaleDateString('en', { month: 'short' })] = { bookings: 0, revenue: 0 };
      }
      bookings.forEach((b) => {
        const key = new Date(b.created_at).toLocaleDateString('en', { month: 'short' });
        if (months[key]) {
          months[key].bookings++;
          if (b.status === 'completed') months[key].revenue += Number(b.amount);
        }
      });
      setMonthlyData(Object.entries(months).map(([month, data]) => ({ month, ...data })));
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
        <p className="text-muted-foreground mt-1">Overview of platform performance</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.totalUsers} icon={Users} iconBg="bg-primary/10" iconColor="text-primary" change={`${stats.providers} providers`} changeType="neutral" />
        <StatCard title="Total Services" value={stats.totalServices} icon={Briefcase} iconBg="bg-blue-100 dark:bg-blue-900/20" iconColor="text-blue-500" change={`${stats.approvedServices} active`} changeType="positive" />
        <StatCard title="Total Bookings" value={stats.totalBookings} icon={TrendingUp} iconBg="bg-green-100 dark:bg-green-900/20" iconColor="text-green-500" change={`${stats.completedBookings} completed`} changeType="positive" />
        <StatCard title="Total Revenue" value={`GH₵${stats.totalRevenue.toFixed(0)}`} icon={DollarSign} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-500" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Monthly chart */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-5">Monthly Activity</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="bookings" name="Bookings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category chart */}
        <div className="bg-card rounded-2xl border border-border p-5">
          <h2 className="font-semibold text-foreground mb-5">Services by Category</h2>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                  {categoryData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', fontSize: '12px' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

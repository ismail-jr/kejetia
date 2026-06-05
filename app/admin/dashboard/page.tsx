'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import StatCard from '@/components/dashboard/StatCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Users, Briefcase, CheckSquare, AlertTriangle, ArrowRight, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

type Service = Database['public']['Tables']['services']['Row'] & {
  profiles?: { full_name: string };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, services: 0, pendingServices: 0, reports: 0 });
  const [pendingServices, setPendingServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const [usersRes, servicesRes, pendingRes, reportsRes] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('services').select('id', { count: 'exact' }),
        supabase.from('services')
          .select('*, profiles(full_name)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(5),
        supabase.from('reports').select('id', { count: 'exact' }).eq('status', 'open'),
      ]);

      setStats({
        users: usersRes.count || 0,
        services: servicesRes.count || 0,
        pendingServices: pendingRes.data?.length || 0,
        reports: reportsRes.count || 0,
      });
      if (pendingRes.data) setPendingServices(pendingRes.data as Service[]);
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.users} icon={Users} iconBg="bg-primary/10" iconColor="text-primary" />
        <StatCard title="Total Services" value={stats.services} icon={Briefcase} iconBg="bg-blue-100 dark:bg-blue-900/20" iconColor="text-blue-500" />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingServices}
          icon={CheckSquare}
          iconBg="bg-amber-100 dark:bg-amber-900/20"
          iconColor="text-amber-500"
          change={stats.pendingServices > 0 ? 'Needs attention' : undefined}
          changeType="negative"
        />
        <StatCard
          title="Open Reports"
          value={stats.reports}
          icon={AlertTriangle}
          iconBg="bg-red-100 dark:bg-red-900/20"
          iconColor="text-red-500"
          change={stats.reports > 0 ? 'Review needed' : undefined}
          changeType={stats.reports > 0 ? 'negative' : 'neutral'}
        />
      </div>

      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending Service Approvals
          </h2>
          <Link href="/admin/approvals" className="text-sm text-primary hover:underline flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-xl animate-shimmer" />)}
          </div>
        ) : pendingServices.length === 0 ? (
          <div className="text-center py-10">
            <CheckSquare className="w-10 h-10 text-green-500 mx-auto mb-3" />
            <p className="text-muted-foreground">All caught up! No pending approvals.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingServices.map((service) => (
              <div key={service.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{service.title}</p>
                  <p className="text-xs text-muted-foreground">
                    By {(service as any).profiles?.full_name} · GH₵{service.price} · {service.category}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-muted-foreground">{format(new Date(service.created_at), 'MMM d')}</span>
                  <Button size="sm" asChild className="rounded-xl shadow-primary">
                    <Link href={`/admin/approvals?service=${service.id}`}>Review</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

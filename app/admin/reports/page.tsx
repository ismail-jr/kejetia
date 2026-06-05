'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertTriangle, CheckCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

type Report = Database['public']['Tables']['reports']['Row'] & {
  reporter?: { full_name: string; email: string };
  reported_user?: { full_name: string };
  services?: { title: string };
};

const STATUS_STYLES: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  investigating: 'bg-amber-100 text-amber-700',
  resolved: 'bg-green-100 text-green-700',
  dismissed: 'bg-muted text-muted-foreground',
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      const { data } = await supabase
        .from('reports')
        .select(`
          *,
          reporter:profiles!reports_reporter_id_fkey(full_name, email),
          reported_user:profiles!reports_reported_user_id_fkey(full_name),
          services(title)
        `)
        .order('created_at', { ascending: false });
      if (data) setReports(data as Report[]);
      setLoading(false);
    };
    fetchReports();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await (supabase.from('reports') as any).update({ status }).eq('id', id);
    if (!error) {
      setReports((prev) => prev.map((r) => r.id === id ? { ...r, status: status as any } : r));
      toast.success(`Report marked as ${status}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Reports & Disputes</h1>
        <p className="text-muted-foreground mt-1">Review and resolve user reports</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl animate-shimmer" />)}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-2xl border border-border">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-semibold text-foreground">No reports</p>
          <p className="text-sm text-muted-foreground mt-1">The platform is all clean!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <h3 className="font-semibold text-foreground">{report.reason}</h3>
                    <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize ml-auto', STATUS_STYLES[report.status])}>
                      {report.status}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                  )}
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>Reporter: {(report as any).reporter?.full_name} ({(report as any).reporter?.email})</p>
                    {(report as any).reported_user && <p>Reported user: {(report as any).reported_user?.full_name}</p>}
                    {(report as any).services && <p>Service: {(report as any).services?.title}</p>}
                    <p>Submitted: {format(new Date(report.created_at), 'MMM d, yyyy')}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                {report.status === 'open' && (
                  <Button size="sm" variant="outline" className="rounded-xl" onClick={() => updateStatus(report.id, 'investigating')}>
                    Investigate
                  </Button>
                )}
                {['open', 'investigating'].includes(report.status) && (
                  <>
                    <Button size="sm" className="rounded-xl shadow-primary" onClick={() => updateStatus(report.id, 'resolved')}>
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                      Resolve
                    </Button>
                    <Button size="sm" variant="ghost" className="rounded-xl text-muted-foreground" onClick={() => updateStatus(report.id, 'dismissed')}>
                      Dismiss
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

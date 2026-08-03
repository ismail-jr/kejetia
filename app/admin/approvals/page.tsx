'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { handleImageError } from '@/lib/utils/image-fallback';
import type { Database } from '@/lib/database.types';

type Service = Database['public']['Tables']['services']['Row'] & {
  profiles?: { full_name: string; email: string; student_id: string };
};

const PEXELS_FALLBACK = 'https://images.pexels.com/photos/3184306/pexels-photo-3184306.jpeg?auto=compress&cs=tinysrgb&w=400';

export default function AdminApprovalsPage() {
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('service');
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Service | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchPending = async () => {
    const { data } = await supabase
      .from('services')
      .select('*, profiles(full_name, email, student_id)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (data) {
      const typed = data as Service[];
      setServices(typed);
      if (highlightId) {
        const found = typed.find((s) => s.id === highlightId);
        if (found) setSelected(found);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const updateServiceStatus = async (id: string, status: string, extra?: Record<string, string>) => {
    const payload: Record<string, string> = { status, ...extra };
    return (supabase.from('services') as any).update(payload).eq('id', id);
  };

  const handleApprove = async () => {
    if (!selected) return;
    setProcessing(true);
    const { error } = await updateServiceStatus(selected.id, 'approved', { rejection_reason: '' });
    if (!error) {
      toast.success('Service approved!');
      setServices((prev) => prev.filter((s) => s.id !== selected.id));
      setSelected(null);
      // Notify provider
      await (supabase.from('notifications') as any).insert({
        user_id: selected.provider_id,
        type: 'info',
        title: 'Service Approved!',
        message: `Your service "${selected.title}" has been approved and is now live.`,
      });
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    if (!selected || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setProcessing(true);
    const { error } = await updateServiceStatus(selected.id, 'rejected', { rejection_reason: rejectionReason });
    if (!error) {
      toast.success('Service rejected');
      setServices((prev) => prev.filter((s) => s.id !== selected.id));
      await (supabase.from('notifications') as any).insert({
        user_id: selected.provider_id,
        type: 'alert',
        title: 'Service Rejected',
        message: `Your service "${selected.title}" was rejected. Reason: ${rejectionReason}`,
      });
      setSelected(null);
      setRejectionReason('');
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Listing Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and approve service listings from providers</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* List */}
        <div className="space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            Pending ({services.length})
          </h2>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-2xl animate-shimmer" />)}
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl border border-border">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-foreground">All caught up!</p>
              <p className="text-sm text-muted-foreground">No pending approvals.</p>
            </div>
          ) : (
            services.map((service) => (
              <button
                key={service.id}
                onClick={() => { setSelected(service); setRejectionReason(''); }}
                className={cn(
                  'w-full flex items-center gap-3 p-4 rounded-2xl border text-left transition-all',
                  selected?.id === service.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/40 hover:shadow-card-hover'
                )}
              >
                <img
                  src={service.images?.[0] || PEXELS_FALLBACK}
                  alt=""
                  onError={handleImageError}
                  className="w-16 h-14 rounded-xl object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground line-clamp-1">{service.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(service as any).profiles?.full_name} · GH₵{service.price}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{service.category}</p>
                </div>
                <div className="text-xs text-muted-foreground flex-shrink-0">
                  {format(new Date(service.created_at), 'MMM d')}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div>
          {!selected ? (
            <div className="text-center py-20 bg-card rounded-2xl border border-border">
              <Eye className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">Select a service to review</p>
            </div>
          ) : (
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <img
                src={selected.images?.[0] || PEXELS_FALLBACK}
                alt={selected.title}
                onError={handleImageError}
                className="w-full h-48 object-cover"
              />
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selected.title}</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {selected.category} · GH₵{selected.price}
                  </p>
                </div>

                <div className="bg-muted rounded-xl p-3">
                  <p className="text-xs font-semibold text-foreground mb-1">Provider</p>
                  <p className="text-sm text-foreground">{(selected as any).profiles?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{(selected as any).profiles?.email}</p>
                  {(selected as any).profiles?.student_id && (
                    <p className="text-xs text-muted-foreground">{(selected as any).profiles?.student_id}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs font-semibold text-foreground mb-1">Description</p>
                  <p className="text-sm text-muted-foreground line-clamp-4">{selected.description}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs">Rejection Reason (required to reject)</Label>
                  <Textarea
                    placeholder="Explain why the service is being rejected..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="rounded-xl resize-none text-sm"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    className="flex-1 rounded-xl shadow-primary"
                    onClick={handleApprove}
                    disabled={processing}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

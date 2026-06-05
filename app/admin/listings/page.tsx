'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Eye, Archive } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';

type Service = Database['public']['Tables']['services']['Row'] & {
  profiles?: { full_name: string };
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  archived: 'bg-muted text-muted-foreground',
};

export default function AdminListingsPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from('services')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false });
      if (data) setServices(data as Service[]);
      setLoading(false);
    };
    fetchServices();
  }, []);

  const handleStatusChange = async (id: string, status: string) => {
    const { error } = await (supabase.from('services') as any).update({ status }).eq('id', id);
    if (!error) {
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, status: status as any } : s));
      toast.success(`Service ${status}`);
    }
  };

  const filtered = services.filter((s) => {
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || s.status === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">All Listings</h1>
        <p className="text-muted-foreground mt-1">Manage all service listings on the platform</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10 rounded-xl"
          />
        </div>
        <div className="flex gap-1 bg-muted rounded-xl p-1">
          {['all', 'approved', 'pending', 'rejected', 'archived'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all',
                filter === s ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-16 rounded-2xl animate-shimmer" />)}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="divide-y divide-border">
            {filtered.map((service) => (
              <div key={service.id} className="flex items-center gap-4 p-4 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{service.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {(service as any).profiles?.full_name} · {service.category} · GH₵{service.price}
                  </p>
                  <p className="text-xs text-muted-foreground">{format(new Date(service.created_at), 'MMM d, yyyy')}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize', STATUS_STYLES[service.status])}>
                    {service.status}
                  </span>
                  {service.status === 'approved' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-lg"
                      onClick={() => handleStatusChange(service.id, 'archived')}
                    >
                      <Archive className="w-3 h-3" />
                    </Button>
                  )}
                  {service.status === 'archived' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 rounded-lg text-green-600"
                      onClick={() => handleStatusChange(service.id, 'approved')}
                    >
                      Restore
                    </Button>
                  )}
                  <Button size="sm" variant="outline" className="h-7 rounded-lg" asChild>
                    <Link href={`/student/services/${service.id}`}>
                      <Eye className="w-3 h-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No listings found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

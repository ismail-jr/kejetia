'use client';

import ServiceCard from './ServiceCard';
import { Loader2 } from 'lucide-react';
import type { Database } from '@/lib/database.types';

type Service = Database['public']['Tables']['services']['Row'] & {
  profiles?: { full_name: string; avatar_url: string; is_verified: boolean };
  is_saved?: boolean;
};

interface ServiceGridProps {
  services: Service[];
  loading?: boolean;
  onSaveToggle?: (serviceId: string, saved: boolean) => void;
  emptyMessage?: string;
}

export default function ServiceGrid({ services, loading, onSaveToggle, emptyMessage }: ServiceGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-card border border-border overflow-hidden">
            <div className="h-44 animate-shimmer" />
            <div className="p-4 space-y-3">
              <div className="h-4 w-3/4 rounded animate-shimmer" />
              <div className="h-3 w-1/2 rounded animate-shimmer" />
              <div className="h-3 w-1/4 rounded animate-shimmer" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!services.length) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No services found</h3>
        <p className="text-muted-foreground text-sm">
          {emptyMessage || 'Try adjusting your search or filters to find what you\'re looking for.'}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} onSaveToggle={onSaveToggle} />
      ))}
    </div>
  );
}

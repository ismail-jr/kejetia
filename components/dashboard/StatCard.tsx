import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  description?: string;
}

export default function StatCard({
  title,
  value,
  change,
  changeType = 'neutral',
  icon: Icon,
  iconBg = 'bg-primary/10',
  iconColor = 'text-primary',
  description,
}: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 hover:shadow-card-hover transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
          <Icon className={cn('w-5 h-5', iconColor)} />
        </div>
        {change && (
          <span className={cn(
            'text-xs font-medium px-2 py-0.5 rounded-full',
            changeType === 'positive' && 'text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30',
            changeType === 'negative' && 'text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30',
            changeType === 'neutral' && 'text-muted-foreground bg-muted',
          )}>
            {change}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{title}</div>
      {description && (
        <div className="text-xs text-muted-foreground mt-1">{description}</div>
      )}
    </div>
  );
}

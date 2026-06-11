import { Star, CheckCircle, Clock, XCircle } from "lucide-react";
import type { Database } from "@/lib/database.types";
import StatCard from "@/components/dashboard/StatCard";

type Service = Database["public"]["Tables"]["services"]["Row"];

interface ServiceStatsProps {
  services: Service[];
}

export function ServiceStats({ services }: ServiceStatsProps) {
  const total = services.length;
  const approved = services.filter((s) => s.status === "approved").length;
  const pending = services.filter((s) => s.status === "pending").length;
  const rejected = services.filter((s) => s.status === "rejected").length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Services */}
      <StatCard
        title="Total Services"
        value={total}
        changeType="neutral"
        rightElement={
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
            <Star className="w-5 h-5 text-blue-500" />
          </div>
        }
      />

      {/* Approved Services */}
      <StatCard
        title="Approved"
        value={approved}
        change={
          total > 0 ? `+${Math.round((approved / total) * 100)}%` : undefined
        }
        changeType="positive"
        changeLabel={total > 0 ? "of total listings" : undefined}
        rightElement={
          <div className="w-10 h-10 rounded-xl bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        }
      />

      {/* Pending Reviews */}
      <StatCard
        title="Pending"
        value={pending}
        changeType="neutral"
        changeLabel="awaiting validation"
        rightElement={
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        }
      />

      {/* Rejected Services */}
      <StatCard
        title="Rejected"
        value={rejected}
        change={
          rejected > 0 ? `${Math.round((rejected / total) * 100)}%` : undefined
        }
        changeType={rejected > 0 ? "negative" : "neutral"}
        changeLabel={rejected > 0 ? "requires updates" : "clean status record"}
        rightElement={
          <div className="w-10 h-10 rounded-xl bg-red-500/10 dark:bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-500" />
          </div>
        }
      />
    </div>
  );
}

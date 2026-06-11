"use client";

import { Users } from "lucide-react";

export function EmptyUsersState() {
  return (
    <div className="text-center py-12">
      <Users className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
      <p className="text-muted-foreground text-sm font-medium">
        No profiles found matching your selection filters.
      </p>
    </div>
  );
}

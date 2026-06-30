import { Suspense } from "react";
import AdminUsersPageClient from "./users-client";

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse bg-muted" />
          ))}
        </div>
      }
    >
      <AdminUsersPageClient />
    </Suspense>
  );
}

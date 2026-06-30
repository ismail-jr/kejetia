"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { Profile, FilterTab } from "./components/types";
import { UserFilters } from "./components/user-filters";
import { UserCardItem } from "./components/user-card-item";
import { EmptyUsersState } from "./components/empty-users-state";

export default function AdminUsersPageClient() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter");

  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>(() => {
    if (
      initialFilter &&
      [
        "all",
        "student",
        "provider",
        "admin",
        "verified",
        "unverified",
      ].includes(initialFilter)
    ) {
      return initialFilter as FilterTab;
    }
    return "all";
  });
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Fetch profiles error:", error);
        toast.error("Failed to load platform profiles");
      } else if (data) {
        setUsers(data as Profile[]);
      }
    } catch (err) {
      console.error("Unexpected fetch execution fault:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const updateRole = async (
    userId: string,
    targetRole: "student" | "provider" | "admin",
  ) => {
    try {
      const localUser = users.find((u) => u.user_id === userId);
      if (!localUser) return;

      if (!localUser.is_admin && targetRole === "admin") {
        toast.error("Admin promotion must be done via the backend or SQL console");
        return;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ active_role: targetRole })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, active_role: targetRole } : u,
        ),
      );

      toast.success(`Active context set to ${targetRole}`);
    } catch (err: any) {
      console.error("Error updating active role:", err);
      toast.error(err.message || "Failed to update user role");
    }
  };

  const setVerified = async (userId: string, verified: boolean) => {
    setVerifyingId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: verified })
        .eq("user_id", userId);

      if (error) throw error;

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, is_verified: verified } : u,
        ),
      );
      toast.success(
        verified
          ? "User verified successfully"
          : "User verification removed",
      );
    } catch (err: any) {
      console.error("Verification update failed:", err);
      toast.error(err.message || "Failed to update verification status");
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.student_id?.toLowerCase() || "").includes(search.toLowerCase());

    const userRolesList = u.roles || [];
    const baseActiveRole = u.active_role || "student";

    let matchesFilter = true;
    if (filter === "verified") matchesFilter = u.is_verified;
    else if (filter === "unverified") matchesFilter = !u.is_verified;
    else if (filter !== "all") {
      matchesFilter =
        baseActiveRole === filter || userRolesList.includes(filter);
    }

    return matchesSearch && matchesFilter;
  });

  const unverifiedCount = users.filter((u) => !u.is_verified).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">
            Users
          </h1>
          <p className="text-muted-foreground mt-1 text-sm font-medium">
            Verify accounts and manage platform access roles.
          </p>
        </div>
        {unverifiedCount > 0 && (
          <button
            type="button"
            onClick={() => setFilter("unverified")}
            className="text-sm font-medium text-amber-600 hover:underline"
          >
            {unverifiedCount} user{unverifiedCount === 1 ? "" : "s"} awaiting
            verification
          </button>
        )}
      </div>

      <UserFilters
        search={search}
        onSearchChange={setSearch}
        filter={filter}
        onFilterChange={setFilter}
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse bg-muted" />
          ))}
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          <div className="divide-y divide-border">
            {filteredUsers.map((user) => (
              <UserCardItem
                key={user.user_id}
                user={user}
                verifying={verifyingId === user.user_id}
                onUpdateRole={updateRole}
                onSetVerified={setVerified}
              />
            ))}
          </div>
          {filteredUsers.length === 0 && <EmptyUsersState />}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

import { Profile, FilterTab } from "./components/types";
import { UserFilters } from "./components/user-filters";
import { UserCardItem } from "./components/user-card-item";
import { EmptyUsersState } from "./components/empty-users-state";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterTab>("all");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: { active_role: "admin" },
        });
      }

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
    currentActiveRole: string,
    targetRole: "student" | "provider" | "admin",
  ) => {
    try {
      const localUser = users.find((u) => u.user_id === userId);
      if (!localUser) return;

      const updatedRoles = [...(localUser.roles || [])];
      if (!updatedRoles.includes(targetRole)) {
        updatedRoles.push(targetRole);
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          active_role: targetRole,
          roles: updatedRoles,
          is_admin: targetRole === "admin" ? true : localUser.is_admin,
        })
        .eq("user_id", userId);

      if (profileError) throw profileError;

      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId
            ? {
                ...u,
                active_role: targetRole,
                roles: updatedRoles,
                is_admin: targetRole === "admin" ? true : u.is_admin,
              }
            : u,
        ),
      );

      toast.success(`Active context shifted to ${targetRole}`);
    } catch (err: any) {
      console.error("Error modifying application role assignment maps:", err);
      toast.error(err.message || "Failed to alter user security roles");
    }
  };

  const toggleVerified = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: nextStatus })
      .eq("user_id", userId);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.user_id === userId ? { ...u, is_verified: nextStatus } : u,
        ),
      );
      toast.success(
        `Profile updated to ${nextStatus ? "Verified" : "Unverified"}`,
      );
    } else {
      toast.error("Failed to alter profile verification parameters");
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      !search ||
      (u.full_name?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (u.email?.toLowerCase() || "").includes(search.toLowerCase());

    const userRolesList = u.roles || [];
    const baseActiveRole = u.active_role || "student";

    const matchesFilter =
      filter === "all" ||
      baseActiveRole === filter ||
      userRolesList.includes(filter);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading tracking-tight text-foreground">
          Users
        </h1>
        <p className="text-muted-foreground mt-1 text-sm font-medium">
          Manage platform profiles and handle operational access roles.
        </p>
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
                onUpdateRole={updateRole}
                onToggleVerified={toggleVerified}
              />
            ))}
          </div>
          {filteredUsers.length === 0 && <EmptyUsersState />}
        </div>
      )}
    </div>
  );
}

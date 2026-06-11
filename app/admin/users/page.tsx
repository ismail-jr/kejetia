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
      // 1. Align active JWT metadata context parameters
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.auth.updateUser({
          data: { active_role: "admin" },
        });
      }

      // 2. Load profiles
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
    profileId: string,
    userId: string,
    currentActiveRole: string,
    targetRole: "student" | "provider" | "admin",
  ) => {
    try {
      const localUser = users.find((u) => u.id === profileId);
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
        .eq("id", profileId);

      if (profileError) throw profileError;

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: targetRole });

      if (roleError && roleError.code !== "23505") throw roleError;

      setUsers((prev) =>
        prev.map((u) =>
          u.id === profileId
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

  const toggleVerified = async (profileId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus;
    const { error } = await supabase
      .from("profiles")
      .update({ is_verified: nextStatus } as any)
      .eq("id", profileId);

    if (!error) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === profileId ? { ...u, is_verified: nextStatus } : u,
        ),
      );
      toast.success(
        `Profile updated to ${nextStatus ? "Verified" : "Unverified"}`,
      );
    } else {
      toast.error("Failed to alter profile verification parameters");
    }
  };

  // Perform search matching & segment tab filtrations
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
                key={user.id}
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

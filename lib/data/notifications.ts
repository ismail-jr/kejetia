import { db } from "@/lib/supabase";
import type { Database } from "@/lib/database.types";
import type { Notification } from "@/lib/data/types";

export type NotificationInsert =
  Database["public"]["Tables"]["notifications"]["Insert"];

export async function listNotifications(
  userId: string,
): Promise<Notification[]> {
  const { data, error } = await db
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as Notification[];
}

export async function createNotification(
  input: NotificationInsert,
): Promise<void> {
  const { error } = await db.from("notifications").insert(input);
  if (error) throw error;
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  if (error) throw error;
}

export async function markAllNotificationsRead(
  userId: string,
): Promise<void> {
  const { error } = await db
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
}

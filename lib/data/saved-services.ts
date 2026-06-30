import { db } from "@/lib/supabase";

// Returns the set of service ids the given student has saved.
export async function getSavedServiceIds(
  studentId: string,
): Promise<Set<string>> {
  const { data, error } = await db
    .from("saved_services")
    .select("service_id")
    .eq("student_id", studentId);

  if (error) throw error;
  return new Set((data ?? []).map((r) => r.service_id));
}

export async function isServiceSaved(
  studentId: string,
  serviceId: string,
): Promise<boolean> {
  const { data, error } = await db
    .from("saved_services")
    .select("id")
    .eq("student_id", studentId)
    .eq("service_id", serviceId)
    .maybeSingle();

  if (error) throw error;
  return !!data;
}

export async function saveService(
  studentId: string,
  serviceId: string,
): Promise<void> {
  const { error } = await db
    .from("saved_services")
    .insert({ student_id: studentId, service_id: serviceId });

  if (error) throw error;
}

export async function unsaveService(
  studentId: string,
  serviceId: string,
): Promise<void> {
  const { error } = await db
    .from("saved_services")
    .delete()
    .eq("student_id", studentId)
    .eq("service_id", serviceId);

  if (error) throw error;
}

// Toggles saved state; returns the new state (true = now saved).
export async function toggleSavedService(
  studentId: string,
  serviceId: string,
  currentlySaved: boolean,
): Promise<boolean> {
  if (currentlySaved) {
    await unsaveService(studentId, serviceId);
    return false;
  }
  await saveService(studentId, serviceId);
  return true;
}

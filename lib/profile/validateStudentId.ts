import { supabase } from "@/lib/supabase";

export const checkStudentIdExists = async (
  student_id: string,
  user_id: string,
) => {
  if (!student_id) return false;

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("student_id", student_id)
    .neq("user_id", user_id)
    .maybeSingle();

  if (error) throw error;

  return !!data;
};

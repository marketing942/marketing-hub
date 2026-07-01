import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

export interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  role: UserRole;
}

/**
 * Retorna o usuário autenticado + seu perfil (role), ou null se não logado.
 * Usa getUser() (valida o token no servidor de auth), não getSession().
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? null,
    role: (profile?.role as UserRole) ?? "viewer",
  };
}

import "server-only";
import { getCurrentUser } from "@/lib/auth/user";

/**
 * Autoriza uma rota de sync: aceita (a) header/param com CRON_SECRET, ou
 * (b) usuário logado admin/coordenador. Retorna null se autorizado, ou uma
 * mensagem de erro.
 */
export async function authorizeSync(request: Request): Promise<string | null> {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization");
  const url = new URL(request.url);
  const paramSecret = url.searchParams.get("secret");

  if (secret) {
    if (header === `Bearer ${secret}` || paramSecret === secret) return null;
  }

  const user = await getCurrentUser();
  if (user && ["admin", "coordinator"].includes(user.role)) return null;

  return "Não autorizado. Envie o CRON_SECRET ou autentique-se como admin/coordenador.";
}

import { NextResponse } from "next/server";
import { runAllSync } from "@/lib/integrations/sync";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAlerts } from "@/lib/alerts/generate";

/**
 * Endpoint de cron (Vercel Cron / agendador externo).
 * Protegido por CRON_SECRET — obrigatório aqui (sem fallback de sessão).
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado no ambiente." },
      { status: 500 },
    );
  }

  const header = request.headers.get("authorization");
  const paramSecret = new URL(request.url).searchParams.get("secret");
  if (header !== `Bearer ${secret}` && paramSecret !== secret) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const summaries = await runAllSync();

  // Reavalia os alertas com base nas métricas recém-sincronizadas (service role).
  let alerts: { created: number; resolved: number; open: number } | { error: string };
  try {
    alerts = await generateAlerts(createAdminClient());
  } catch (e) {
    alerts = { error: (e as Error).message };
  }

  return NextResponse.json({
    ranAt: new Date().toISOString(),
    results: summaries,
    alerts,
  });
}

export { GET as POST };

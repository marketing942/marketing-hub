import { NextResponse } from "next/server";
import { authorizeSync } from "@/lib/integrations/auth-guard";
import { runProviderSync } from "@/lib/integrations/sync";
import type { ProviderId } from "@/lib/integrations/types";

const VALID: ProviderId[] = ["meta_ads", "google_ads", "instagram", "ga4"];

export async function POST(
  request: Request,
  ctx: { params: Promise<{ provider: string }> },
) {
  const denied = await authorizeSync(request);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const { provider } = await ctx.params;
  if (!VALID.includes(provider as ProviderId)) {
    return NextResponse.json({ error: `Provedor inválido: ${provider}` }, { status: 400 });
  }

  const url = new URL(request.url);
  const companySlug = url.searchParams.get("company") ?? undefined;
  const summary = await runProviderSync(provider as ProviderId, { companySlug });
  return NextResponse.json(summary, { status: summary.status === "success" ? 200 : 502 });
}

export { POST as GET };

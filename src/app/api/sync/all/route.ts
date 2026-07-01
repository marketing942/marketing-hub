import { NextResponse } from "next/server";
import { authorizeSync } from "@/lib/integrations/auth-guard";
import { runAllSync } from "@/lib/integrations/sync";

export async function POST(request: Request) {
  const denied = await authorizeSync(request);
  if (denied) return NextResponse.json({ error: denied }, { status: 401 });

  const url = new URL(request.url);
  const companySlug = url.searchParams.get("company") ?? undefined;
  const summaries = await runAllSync(companySlug);
  return NextResponse.json({ results: summaries });
}

export { POST as GET };

import Link from "next/link";
import { Tv } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { fetchDashboardData } from "@/lib/metrics/dashboard-data";
import { resolveLayoutsByCompany } from "@/lib/layouts/queries";
import { DashboardView } from "./dashboard-view";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const data = await fetchDashboardData();
  const layouts = await resolveLayoutsByCompany(
    data.map((d) => d.company.id),
    "executive",
  );

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Acompanhe a performance de marketing por empresa."
        actions={
          <Link href="/tv">
            <Button variant="outline" size="sm">
              <Tv className="h-4 w-4" />
              Modo TV
            </Button>
          </Link>
        }
      />
      <DashboardView data={data} layouts={layouts} />
    </div>
  );
}

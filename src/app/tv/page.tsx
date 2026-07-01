import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/user";
import { fetchDashboardData } from "@/lib/metrics/dashboard-data";
import { TVDashboard } from "@/components/tv/tv-dashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Modo TV · CPPEM Marketing Hub",
};

export default async function TVPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await fetchDashboardData();
  return <TVDashboard data={data} />;
}

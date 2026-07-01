import type { ProviderMeta } from "./types";

/** Metadados dos provedores (client-safe — sem segredos). */
export const PROVIDERS: ProviderMeta[] = [
  {
    id: "meta_ads",
    label: "Meta Ads",
    envKeys: ["META_APP_ID", "META_APP_SECRET", "META_ACCESS_TOKEN"],
    description:
      "Campanhas, investimento, impressões, cliques, CTR, CPC, CPM, leads, conversões, CPL e ROAS.",
    accountLabel: "Ad Account (act_...)",
  },
  {
    id: "google_ads",
    label: "Google Ads",
    envKeys: [
      "GOOGLE_ADS_CLIENT_ID",
      "GOOGLE_ADS_CLIENT_SECRET",
      "GOOGLE_ADS_DEVELOPER_TOKEN",
      "GOOGLE_ADS_REFRESH_TOKEN",
    ],
    description:
      "Campanhas, custo, cliques, impressões, CTR, CPC médio, conversões e custo por conversão.",
    accountLabel: "Customer ID",
  },
  {
    id: "instagram",
    label: "Instagram",
    envKeys: ["META_ACCESS_TOKEN"],
    description:
      "Seguidores, alcance, impressões, cliques, mídias, reels, stories e engajamento.",
    accountLabel: "IG Business Account ID",
  },
  {
    id: "ga4",
    label: "GA4",
    envKeys: ["GA4_PROPERTY_ID"],
    description:
      "Sessões, usuários, eventos, conversões, origem/mídia, páginas e leads por origem.",
    accountLabel: "Property ID",
  },
];

export const PROVIDER_BY_ID = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p]),
) as Record<string, ProviderMeta>;

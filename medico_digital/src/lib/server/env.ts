function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

export const env = {
  hfToken: process.env.HF_TOKEN ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
};

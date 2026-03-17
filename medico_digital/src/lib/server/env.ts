function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

const appUrlInput =
  process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const env = {
  appUrl: normalizeUrl(appUrlInput),
  hfToken: process.env.HF_TOKEN ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
};

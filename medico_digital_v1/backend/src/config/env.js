process.loadEnvFile();

export const env = {
  port: Number(process.env.PORT ?? "3000"),
  hfToken: process.env.HF_TOKEN ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
};

import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value.trim();
}

export const env = {
  PORT: Number(process.env.PORT ?? 5000),
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: requireEnv("SUPABASE_PUBLISHABLE_KEY"),
};
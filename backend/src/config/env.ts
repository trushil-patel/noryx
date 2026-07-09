import dotenv from "dotenv";

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value || value.trim() === "") {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

export const env = {
  PORT: process.env.PORT ?? "5000",
  SUPABASE_URL: requireEnv("SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: requireEnv("SUPABASE_PUBLISHABLE_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  GEMINI_API_KEY: requireEnv("GEMINI_API_KEY"),
  GEMINI_MODEL: process.env.GEMINI_MODEL ?? "gemini-2.5-flash",
};
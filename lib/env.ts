import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.url({ message: "DATABASE_URL must be a valid URL" }),
  GOOGLE_CLIENT_ID: z.string().min(1, { message: "GOOGLE_CLIENT_ID is required" }),
  GOOGLE_CLIENT_SECRET: z.string().min(1, { message: "GOOGLE_CLIENT_SECRET is required" }),
  ABLY_API_KEY: z.string().min(1, { message: "ABLY_API_KEY is required" }),
  NEXT_PUBLIC_ABLY_KEY: z.string().min(1, { message: "NEXT_PUBLIC_ABLY_KEY is required" }),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export const env = envSchema.parse(process.env);
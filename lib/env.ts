import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  TWENTY_API_URL: z.string().url().default("https://api.twenty.com"),
  TWENTY_API_KEY: z.string().min(1).optional(),
  TWENTY_PERSON_OBJECT: z.string().min(1).default("people"),
  TWENTY_FIELD_HOMEHELPER_USER_ID: z.string().min(1).default("homehelperUserId"),
  TWENTY_FIELD_HOMEHELPER_ROLE: z.string().min(1).default("homehelperRole"),
  TWENTY_FIELD_FAMILY_ID: z.string().min(1).default("familyId"),
  TWENTY_FIELD_FAMILY_NAME: z.string().min(1).default("familyName"),
  TWENTY_FIELD_XP_LEVEL: z.string().min(1).default("level"),
  TWENTY_FIELD_XP_POINTS: z.string().min(1).default("xpPoints"),
  TWENTY_FIELD_ONBOARDING_STATUS: z.string().min(1).default("onboardingStatus"),
  /** Set false if Emails is deactivated in Twenty Data Model */
  TWENTY_SEND_EMAILS: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
});

let cachedEnv: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (cachedEnv) {
    return cachedEnv;
  }

  cachedEnv = envSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    TWENTY_API_URL: process.env.TWENTY_API_URL,
    TWENTY_API_KEY: process.env.TWENTY_API_KEY,
    TWENTY_PERSON_OBJECT: process.env.TWENTY_PERSON_OBJECT,
    TWENTY_FIELD_HOMEHELPER_USER_ID: process.env.TWENTY_FIELD_HOMEHELPER_USER_ID,
    TWENTY_FIELD_HOMEHELPER_ROLE: process.env.TWENTY_FIELD_HOMEHELPER_ROLE,
    TWENTY_FIELD_FAMILY_ID: process.env.TWENTY_FIELD_FAMILY_ID,
    TWENTY_FIELD_FAMILY_NAME: process.env.TWENTY_FIELD_FAMILY_NAME,
    TWENTY_FIELD_XP_LEVEL: process.env.TWENTY_FIELD_XP_LEVEL,
    TWENTY_FIELD_XP_POINTS: process.env.TWENTY_FIELD_XP_POINTS,
    TWENTY_FIELD_ONBOARDING_STATUS: process.env.TWENTY_FIELD_ONBOARDING_STATUS,
    TWENTY_SEND_EMAILS: process.env.TWENTY_SEND_EMAILS,
  });

  return cachedEnv;
}

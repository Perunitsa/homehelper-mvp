import { z } from "zod";

const emptyToUndefined = (value: unknown) => value === "" ? undefined : value;
const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);
const optionalBooleanString = z.preprocess(
  emptyToUndefined,
  z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
);

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  HUBSPOT_API_URL: z.string().url().default("https://api.hubapi.com"),
  HUBSPOT_ACCESS_TOKEN: optionalString,
  HUBSPOT_FIELD_HOMEHELPER_USER_ID: z.string().min(1).default("homehelper_user_id"),
  HUBSPOT_FIELD_ROLE: z.string().min(1).default("role"),
  HUBSPOT_FIELD_FAMILY_ID: z.string().min(1).default("family_id"),
  HUBSPOT_FIELD_FAMILY_NAME: z.string().min(1).default("family_name"),
  HUBSPOT_FIELD_LEVEL: z.string().min(1).default("level"),
  HUBSPOT_FIELD_XP_POINTS: z.string().min(1).default("xp_points"),
  HUBSPOT_FIELD_ONBOARDING_STATUS: z.string().min(1).default("onboarding_status"),
  HUBSPOT_BULK_SYNC_SECRET: optionalString,
  PYRUS_LOGIN: optionalString,
  PYRUS_SECURITY_KEY: optionalString,
  PYRUS_FORM_ID: optionalString,
  PYRUS_FIELD_HOMEHELPER_TASK_ID: z.string().min(1).default("homehelper_task_id"),
  PYRUS_FIELD_TITLE: z.string().min(1).default("title"),
  PYRUS_FIELD_DESCRIPTION: z.string().min(1).default("description"),
  PYRUS_FIELD_STATUS: z.string().min(1).default("status"),
  PYRUS_FIELD_POINTS: z.string().min(1).default("points"),
  PYRUS_FIELD_DEADLINE: z.string().min(1).default("deadline"),
  PYRUS_FIELD_FAMILY_ID: z.string().min(1).default("family_id"),
  PYRUS_FIELD_FAMILY_NAME: z.string().min(1).default("family_name"),
  PYRUS_FIELD_CHILD_ID: z.string().min(1).default("child_id"),
  PYRUS_FIELD_CHILD_NAME: z.string().min(1).default("child_name"),
  PYRUS_FIELD_CHILD_EMAIL: z.string().min(1).default("child_email"),
  PYRUS_FIELD_PARENT_ID: optionalString,
  PYRUS_FIELD_PARENT_NAME: optionalString,
  PYRUS_FIELD_PARENT_EMAIL: optionalString,
  PYRUS_FIELD_PROOF_URL: z.string().min(1).default("proof_url"),
  TWENTY_API_URL: z.string().url().default("https://api.twenty.com"),
  TWENTY_API_KEY: optionalString,
  TWENTY_PERSON_OBJECT: z.string().min(1).default("people"),
  TWENTY_FIELD_HOMEHELPER_USER_ID: z.string().min(1).default("homehelperUserId"),
  TWENTY_FIELD_HOMEHELPER_ROLE: z.string().min(1).default("homehelperRole"),
  TWENTY_FIELD_FAMILY_ID: z.string().min(1).default("familyId"),
  TWENTY_FIELD_FAMILY_NAME: z.string().min(1).default("familyName"),
  TWENTY_FIELD_XP_LEVEL: z.string().min(1).default("level"),
  TWENTY_FIELD_XP_POINTS: z.string().min(1).default("xpPoints"),
  TWENTY_FIELD_ONBOARDING_STATUS: z.string().min(1).default("onboardingStatus"),
  /** Set false if Emails is deactivated in Twenty Data Model */
  TWENTY_SEND_EMAILS: optionalBooleanString,
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
    HUBSPOT_API_URL: process.env.HUBSPOT_API_URL,
    HUBSPOT_ACCESS_TOKEN: process.env.HUBSPOT_ACCESS_TOKEN,
    HUBSPOT_FIELD_HOMEHELPER_USER_ID: process.env.HUBSPOT_FIELD_HOMEHELPER_USER_ID,
    HUBSPOT_FIELD_ROLE: process.env.HUBSPOT_FIELD_ROLE,
    HUBSPOT_FIELD_FAMILY_ID: process.env.HUBSPOT_FIELD_FAMILY_ID,
    HUBSPOT_FIELD_FAMILY_NAME: process.env.HUBSPOT_FIELD_FAMILY_NAME,
    HUBSPOT_FIELD_LEVEL: process.env.HUBSPOT_FIELD_LEVEL,
    HUBSPOT_FIELD_XP_POINTS: process.env.HUBSPOT_FIELD_XP_POINTS,
    HUBSPOT_FIELD_ONBOARDING_STATUS: process.env.HUBSPOT_FIELD_ONBOARDING_STATUS,
    HUBSPOT_BULK_SYNC_SECRET: process.env.HUBSPOT_BULK_SYNC_SECRET,
    PYRUS_LOGIN: process.env.PYRUS_LOGIN,
    PYRUS_SECURITY_KEY: process.env.PYRUS_SECURITY_KEY,
    PYRUS_FORM_ID: process.env.PYRUS_FORM_ID,
    PYRUS_FIELD_HOMEHELPER_TASK_ID: process.env.PYRUS_FIELD_HOMEHELPER_TASK_ID,
    PYRUS_FIELD_TITLE: process.env.PYRUS_FIELD_TITLE,
    PYRUS_FIELD_DESCRIPTION: process.env.PYRUS_FIELD_DESCRIPTION,
    PYRUS_FIELD_STATUS: process.env.PYRUS_FIELD_STATUS,
    PYRUS_FIELD_POINTS: process.env.PYRUS_FIELD_POINTS,
    PYRUS_FIELD_DEADLINE: process.env.PYRUS_FIELD_DEADLINE,
    PYRUS_FIELD_FAMILY_ID: process.env.PYRUS_FIELD_FAMILY_ID,
    PYRUS_FIELD_FAMILY_NAME: process.env.PYRUS_FIELD_FAMILY_NAME,
    PYRUS_FIELD_CHILD_ID: process.env.PYRUS_FIELD_CHILD_ID,
    PYRUS_FIELD_CHILD_NAME: process.env.PYRUS_FIELD_CHILD_NAME,
    PYRUS_FIELD_CHILD_EMAIL: process.env.PYRUS_FIELD_CHILD_EMAIL,
    PYRUS_FIELD_PARENT_ID: process.env.PYRUS_FIELD_PARENT_ID,
    PYRUS_FIELD_PARENT_NAME: process.env.PYRUS_FIELD_PARENT_NAME,
    PYRUS_FIELD_PARENT_EMAIL: process.env.PYRUS_FIELD_PARENT_EMAIL,
    PYRUS_FIELD_PROOF_URL: process.env.PYRUS_FIELD_PROOF_URL,
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

import { getEnv } from "@/lib/env";

type HomeHelperRole = "parent" | "child";
type HomeHelperOnboardingStatus =
  | "created_family"
  | "joined_family"
  | "manual_sync";

type HomeHelperCrmProfile = {
  userId: string;
  email: string;
  firstName: string;
  lastName?: string | null;
  role: HomeHelperRole;
  familyId: string;
  familyName?: string | null;
  level?: number | null;
  currentXp?: number | null;
  onboardingStatus?: HomeHelperOnboardingStatus;
};

type TwentySyncResult =
  | { skipped: true; reason: "missing_api_key" }
  | { skipped: false; ok: true; status: number; data: unknown }
  | {
      skipped: false;
      ok: false;
      status: number;
      error: string;
      data?: unknown;
      payload?: Record<string, unknown>;
    };

/** Twenty SELECT enums from workspace OpenAPI schema */
const TWENTY_ROLE: Record<HomeHelperRole, string> = {
  parent: "PARENT",
  child: "CHILD",
};

const TWENTY_ONBOARDING: Record<HomeHelperOnboardingStatus, string> = {
  created_family: "CREATED_FAMILY",
  joined_family: "JOINED_FAMILY",
  manual_sync: "MANUAL_SYNC",
};

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function addCustomField(
  payload: Record<string, unknown>,
  fieldName: string,
  value: unknown,
) {
  if (value !== undefined && value !== null && value !== "") {
    payload[fieldName] = value;
  }
}

function buildTwentyPersonPayload(profile: HomeHelperCrmProfile) {
  const env = getEnv();
  const payload: Record<string, unknown> = {
    name: {
      firstName: profile.firstName,
      lastName: profile.lastName ?? "",
    },
  };

  if (env.TWENTY_SEND_EMAILS && profile.email) {
    payload.emails = {
      primaryEmail: profile.email,
      additionalEmails: [],
    };
  }

  addCustomField(payload, env.TWENTY_FIELD_HOMEHELPER_USER_ID, profile.userId);
  addCustomField(
    payload,
    env.TWENTY_FIELD_HOMEHELPER_ROLE,
    TWENTY_ROLE[profile.role],
  );
  addCustomField(payload, env.TWENTY_FIELD_FAMILY_ID, profile.familyId);
  addCustomField(payload, env.TWENTY_FIELD_FAMILY_NAME, profile.familyName);
  addCustomField(payload, env.TWENTY_FIELD_XP_LEVEL, profile.level ?? 1);
  addCustomField(payload, env.TWENTY_FIELD_XP_POINTS, profile.currentXp ?? 0);
  addCustomField(
    payload,
    env.TWENTY_FIELD_ONBOARDING_STATUS,
    TWENTY_ONBOARDING[profile.onboardingStatus ?? "manual_sync"],
  );

  return payload;
}

export async function syncHomeHelperProfileToTwenty(
  profile: HomeHelperCrmProfile,
): Promise<TwentySyncResult> {
  const env = getEnv();

  if (!env.TWENTY_API_KEY) {
    return { skipped: true, reason: "missing_api_key" };
  }

  const payload = buildTwentyPersonPayload(profile);
  const baseUrl = normalizeBaseUrl(env.TWENTY_API_URL);
  const objectName = env.TWENTY_PERSON_OBJECT.replace(/^\/+|\/+$/g, "");
  const response = await fetch(`${baseUrl}/rest/${objectName}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.TWENTY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    return {
      skipped: false,
      ok: false,
      status: response.status,
      error: extractTwentyErrorMessage(data) || response.statusText || "Twenty CRM request failed",
      data,
      payload,
    };
  }

  return { skipped: false, ok: true, status: response.status, data };
}

function extractTwentyErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object") {
    return undefined;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.message === "string") {
    return record.message;
  }
  if (Array.isArray(record.messages) && typeof record.messages[0] === "string") {
    return record.messages[0];
  }
  if (Array.isArray(record.errors) && record.errors[0]) {
    const first = record.errors[0];
    if (typeof first === "string") {
      return first;
    }
    if (typeof first === "object" && first && "message" in first) {
      return String((first as { message: unknown }).message);
    }
  }

  return undefined;
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

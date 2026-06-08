import { getEnv } from "@/lib/env";

type HomeHelperRole = "parent" | "child";
type HomeHelperOnboardingStatus =
  | "created_family"
  | "joined_family"
  | "manual_sync";

export type HomeHelperCrmProfile = {
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

type HubSpotSyncAction = "created" | "updated";

type HubSpotSyncResult =
  | { skipped: true; reason: "missing_access_token" }
  | { skipped: false; ok: true; action: HubSpotSyncAction; status: number; data: unknown }
  | {
      skipped: false;
      ok: false;
      action?: HubSpotSyncAction;
      status: number;
      error: string;
      data?: unknown;
      payload?: Record<string, unknown>;
    };

const HUBSPOT_CONTACTS_PATH = "/crm/v3/objects/contacts";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function addProperty(
  properties: Record<string, string>,
  fieldName: string,
  value: unknown,
) {
  if (value !== undefined && value !== null && value !== "") {
    properties[fieldName] = String(value);
  }
}

function buildHubSpotContactProperties(profile: HomeHelperCrmProfile) {
  const env = getEnv();
  const properties: Record<string, string> = {};

  addProperty(properties, "email", profile.email);
  addProperty(properties, "firstname", profile.firstName);
  addProperty(properties, "lastname", profile.lastName);
  addProperty(properties, env.HUBSPOT_FIELD_HOMEHELPER_USER_ID, profile.userId);
  addProperty(properties, env.HUBSPOT_FIELD_ROLE, profile.role);
  addProperty(properties, env.HUBSPOT_FIELD_FAMILY_ID, profile.familyId);
  addProperty(properties, env.HUBSPOT_FIELD_FAMILY_NAME, profile.familyName);
  addProperty(properties, env.HUBSPOT_FIELD_LEVEL, profile.level ?? 1);
  addProperty(properties, env.HUBSPOT_FIELD_XP_POINTS, profile.currentXp ?? 0);
  addProperty(
    properties,
    env.HUBSPOT_FIELD_ONBOARDING_STATUS,
    profile.onboardingStatus ?? "manual_sync",
  );

  return properties;
}

async function hubSpotRequest(path: string, init: RequestInit) {
  const env = getEnv();
  const baseUrl = normalizeBaseUrl(env.HUBSPOT_API_URL);

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  return { response, data };
}

async function findHubSpotContactIdByEmail(email: string) {
  const { response, data } = await hubSpotRequest(`${HUBSPOT_CONTACTS_PATH}/search`, {
    method: "POST",
    body: JSON.stringify({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "EQ",
              value: email,
            },
          ],
        },
      ],
      properties: ["email"],
      limit: 1,
    }),
  });

  if (!response.ok) {
    return {
      ok: false as const,
      status: response.status,
      error: extractHubSpotErrorMessage(data) || response.statusText || "HubSpot search failed",
      data,
    };
  }

  const results = isRecord(data) && Array.isArray(data.results) ? data.results : [];
  const first = results[0];
  const id = isRecord(first) && typeof first.id === "string" ? first.id : null;

  return { ok: true as const, id };
}

export async function syncHomeHelperProfileToHubSpot(
  profile: HomeHelperCrmProfile,
): Promise<HubSpotSyncResult> {
  const env = getEnv();

  if (!env.HUBSPOT_ACCESS_TOKEN) {
    return { skipped: true, reason: "missing_access_token" };
  }

  const properties = buildHubSpotContactProperties(profile);
  const payload = { properties };
  const existing = profile.email
    ? await findHubSpotContactIdByEmail(profile.email)
    : { ok: true as const, id: null };

  if (!existing.ok) {
    return {
      skipped: false,
      ok: false,
      status: existing.status,
      error: existing.error,
      data: existing.data,
      payload,
    };
  }

  const action: HubSpotSyncAction = existing.id ? "updated" : "created";
  const path = existing.id
    ? `${HUBSPOT_CONTACTS_PATH}/${existing.id}`
    : HUBSPOT_CONTACTS_PATH;
  const method = existing.id ? "PATCH" : "POST";
  const { response, data } = await hubSpotRequest(path, {
    method,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    return {
      skipped: false,
      ok: false,
      action,
      status: response.status,
      error: extractHubSpotErrorMessage(data) || response.statusText || "HubSpot request failed",
      data,
      payload,
    };
  }

  return { skipped: false, ok: true, action, status: response.status, data };
}

function extractHubSpotErrorMessage(data: unknown): string | undefined {
  if (!isRecord(data)) {
    return undefined;
  }

  if (typeof data.message === "string") {
    return data.message;
  }

  if (Array.isArray(data.errors) && data.errors[0]) {
    const first = data.errors[0];
    if (typeof first === "string") {
      return first;
    }
    if (isRecord(first) && typeof first.message === "string") {
      return first.message;
    }
  }

  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

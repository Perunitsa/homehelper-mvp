import { getEnv } from "@/lib/env";

type PyrusTaskStatus =
  | "pending"
  | "in_review"
  | "needs_fix"
  | "approved"
  | "completed"
  | "rejected";

export type HomeHelperBpmsTask = {
  taskId: string;
  title: string;
  description?: string | null;
  status: PyrusTaskStatus;
  points?: number | null;
  deadline?: string | null;
  familyId: string;
  familyName?: string | null;
  childId: string;
  childName?: string | null;
  childEmail?: string | null;
  parentId?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  proofUrl?: string | null;
};

type PyrusSyncResult =
  | { skipped: true; reason: "missing_credentials" | "missing_form_id" }
  | { skipped: false; ok: true; status: number; data: unknown }
  | {
      skipped: false;
      ok: false;
      status: number;
      error: string;
      data?: unknown;
      payload?: Record<string, unknown>;
    };

type PyrusAuthResponse = {
  access_token?: string;
  api_url?: string;
  error?: string;
  error_code?: string;
};

type PyrusTaskResponse = {
  task?: {
    id?: number;
  };
};

type PyrusFieldValue =
  | string
  | number
  | {
      choice_ids: number[];
    };

type PyrusFormField = {
  id?: number;
  code?: string;
  type?: string;
  info?: {
    code?: string;
    options?: Array<{
      choice_id: number;
      choice_value: string;
    }>;
  };
};

type PyrusFormResponse = {
  fields?: PyrusFormField[];
};

type PyrusFormMetadata = Awaited<ReturnType<typeof getPyrusFormMetadata>>;

const DEFAULT_PYRUS_API_URL = "https://api.pyrus.com/v4";
const PYRUS_AUTH_URL = "https://accounts.pyrus.com/api/v4/auth";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "");
}

function addField(
  fields: Array<{ code: string; value: PyrusFieldValue }>,
  code: string | undefined,
  value: unknown,
) {
  if (code && value !== undefined && value !== null && value !== "") {
    fields.push({
      code,
      value: typeof value === "number" || typeof value === "object"
        ? value as PyrusFieldValue
        : String(value),
    });
  }
}

function formatPyrusDate(value?: string | null) {
  if (!value) {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toISOString().slice(0, 10);
}

async function authorizePyrus() {
  const env = getEnv();

  const response = await fetch(PYRUS_AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: env.PYRUS_LOGIN,
      security_key: env.PYRUS_SECURITY_KEY,
    }),
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) as PyrusAuthResponse : {};

  if (!response.ok || !data.access_token) {
    return {
      ok: false as const,
      status: response.status,
      error: data.error || response.statusText || "Pyrus authorization failed",
      data,
    };
  }

  return {
    ok: true as const,
    accessToken: data.access_token,
    apiUrl: normalizeBaseUrl(data.api_url || DEFAULT_PYRUS_API_URL),
  };
}

async function getPyrusFormMetadata(
  apiUrl: string,
  accessToken: string,
  formId: number,
) {
  const response = await fetch(`${apiUrl}/forms/${formId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) as PyrusFormResponse : {};

  if (!response.ok || !Array.isArray(data.fields)) {
    console.warn("Pyrus form metadata load failed:", {
      status: response.status,
      data,
    });
    return null;
  }

  const fields = data.fields.map((field) => ({
    ...field,
    code: field.code || field.info?.code,
  }));
  const fieldsByCode = new Map(
    fields
      .filter((field): field is PyrusFormField & { code: string } => Boolean(field.code))
      .map((field) => [field.code, field]),
  );

  return { fieldsByCode };
}

function toPyrusStatus(status: PyrusTaskStatus) {
  switch (status) {
    case "pending":
      return "Created";
    case "in_review":
      return "In Review";
    case "needs_fix":
    case "rejected":
      return "Needs Fix";
    case "approved":
    case "completed":
      return "Approved";
    default:
      return status;
  }
}

function normalizeFieldValue(field: PyrusFormField, value: PyrusFieldValue) {
  if (field.type !== "multiple_choice" || typeof value !== "string") {
    return value;
  }

  const option = field.info?.options?.find(
    (candidate) => candidate.choice_value.toLowerCase() === value.toLowerCase(),
  );

  return option ? { choice_ids: [option.choice_id] } : value;
}

function buildPyrusFormTaskPayload(task: HomeHelperBpmsTask, formId: number) {
  const env = getEnv();
  const fields: Array<{ code: string; value: PyrusFieldValue }> = [];
  const pyrusStatus = toPyrusStatus(task.status);

  addField(fields, env.PYRUS_FIELD_HOMEHELPER_TASK_ID, task.taskId);
  addField(fields, env.PYRUS_FIELD_TITLE, task.title);
  addField(fields, env.PYRUS_FIELD_DESCRIPTION, task.description);
  addField(fields, env.PYRUS_FIELD_STATUS, pyrusStatus);
  addField(fields, "Status", pyrusStatus);
  addField(fields, env.PYRUS_FIELD_POINTS, task.points ?? 0);
  addField(fields, env.PYRUS_FIELD_DEADLINE, formatPyrusDate(task.deadline));
  addField(fields, env.PYRUS_FIELD_FAMILY_ID, task.familyId);
  addField(fields, env.PYRUS_FIELD_FAMILY_NAME, task.familyName);
  addField(fields, env.PYRUS_FIELD_CHILD_ID, task.childId);
  addField(fields, env.PYRUS_FIELD_CHILD_NAME, task.childName);
  addField(fields, env.PYRUS_FIELD_CHILD_EMAIL, task.childEmail);
  addField(fields, env.PYRUS_FIELD_PARENT_ID, task.parentId);
  addField(fields, env.PYRUS_FIELD_PARENT_NAME, task.parentName);
  addField(fields, env.PYRUS_FIELD_PARENT_EMAIL, task.parentEmail);
  addField(fields, env.PYRUS_FIELD_PROOF_URL, task.proofUrl);

  return {
    form_id: formId,
    fields,
    text: `HomeHelper task review: ${task.title}`,
  };
}

function filterAndNormalizeFields(
  fields: Array<{ code: string; value: PyrusFieldValue }>,
  formMetadata: PyrusFormMetadata,
) {
  if (!formMetadata) {
    return fields;
  }

  return fields.flatMap((field) => {
    const formField = formMetadata.fieldsByCode.get(field.code);
    if (!formField) {
      return [];
    }

    return [{
      code: field.code,
      value: normalizeFieldValue(formField, field.value),
    }];
  });
}

function buildPyrusFieldUpdates(
  fields: Array<{ code: string; value: PyrusFieldValue }>,
  formMetadata: PyrusFormMetadata,
) {
  if (!formMetadata) {
    return [];
  }

  return fields.flatMap((field) => {
    const formField = formMetadata.fieldsByCode.get(field.code);
    if (!formField?.id) {
      return [];
    }

    return [{
      id: formField.id,
      value: normalizeFieldValue(formField, field.value),
    }];
  });
}

export async function createPyrusTaskReview(
  task: HomeHelperBpmsTask,
): Promise<PyrusSyncResult> {
  const env = getEnv();

  if (!env.PYRUS_LOGIN || !env.PYRUS_SECURITY_KEY) {
    return { skipped: true, reason: "missing_credentials" };
  }

  if (!env.PYRUS_FORM_ID) {
    return { skipped: true, reason: "missing_form_id" };
  }

  const formId = Number(env.PYRUS_FORM_ID);
  if (!Number.isInteger(formId) || formId <= 0) {
    return {
      skipped: false,
      ok: false,
      status: 400,
      error: "PYRUS_FORM_ID must be a positive integer",
    };
  }

  const auth = await authorizePyrus();
  if (!auth.ok) {
    return {
      skipped: false,
      ok: false,
      status: auth.status,
      error: auth.error,
      data: auth.data,
    };
  }

  const formMetadata = await getPyrusFormMetadata(
    auth.apiUrl,
    auth.accessToken,
    formId,
  );
  const payload = buildPyrusFormTaskPayload(task, formId);
  payload.fields = filterAndNormalizeFields(payload.fields, formMetadata);

  const response = await fetch(`${auth.apiUrl}/tasks`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) as PyrusTaskResponse : null;

  if (!response.ok) {
    return {
      skipped: false,
      ok: false,
      status: response.status,
      error: extractPyrusErrorMessage(data) || response.statusText || "Pyrus task creation failed",
      data,
      payload,
    };
  }

  return { skipped: false, ok: true, status: response.status, data };
}

export async function updatePyrusTaskReview(
  pyrusTaskId: number,
  task: HomeHelperBpmsTask,
): Promise<PyrusSyncResult> {
  const env = getEnv();

  if (!env.PYRUS_LOGIN || !env.PYRUS_SECURITY_KEY) {
    return { skipped: true, reason: "missing_credentials" };
  }

  if (!env.PYRUS_FORM_ID) {
    return { skipped: true, reason: "missing_form_id" };
  }

  const formId = Number(env.PYRUS_FORM_ID);
  if (!Number.isInteger(formId) || formId <= 0) {
    return {
      skipped: false,
      ok: false,
      status: 400,
      error: "PYRUS_FORM_ID must be a positive integer",
    };
  }

  const auth = await authorizePyrus();
  if (!auth.ok) {
    return {
      skipped: false,
      ok: false,
      status: auth.status,
      error: auth.error,
      data: auth.data,
    };
  }

  const formMetadata = await getPyrusFormMetadata(
    auth.apiUrl,
    auth.accessToken,
    formId,
  );
  const payload = buildPyrusFormTaskPayload(task, formId);
  const fieldUpdates = buildPyrusFieldUpdates(payload.fields, formMetadata);
  const commentPayload = {
    text: `HomeHelper status: ${toPyrusStatus(task.status)}`,
    field_updates: fieldUpdates,
  };

  const response = await fetch(`${auth.apiUrl}/tasks/${pyrusTaskId}/comments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commentPayload),
  });

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    return {
      skipped: false,
      ok: false,
      status: response.status,
      error: extractPyrusErrorMessage(data) || response.statusText || "Pyrus task update failed",
      data,
      payload: commentPayload,
    };
  }

  return { skipped: false, ok: true, status: response.status, data };
}

export function getPyrusTaskId(result: PyrusSyncResult) {
  if (result.skipped || !result.ok) {
    return null;
  }

  const data = result.data as PyrusTaskResponse | null;
  return typeof data?.task?.id === "number" ? data.task.id : null;
}

function extractPyrusErrorMessage(data: unknown): string | undefined {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return undefined;
  }

  const record = data as Record<string, unknown>;
  if (typeof record.error === "string") {
    return record.error;
  }
  if (typeof record.message === "string") {
    return record.message;
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

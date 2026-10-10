import { z } from "zod";
import { ApiError } from "@/lib/api/types";

/**
 * Typed fetch wrapper. Parses every response with zod (AGENTS.md A4: no `any`).
 * Sends an idempotency key on mutating calls (AGENTS.md A6).
 */

export class HttpError extends Error {
  code: string;
  status: number;
  constructor(message: string, code = "REQUEST_FAILED", status = 0) {
    super(message);
    this.name = "HttpError";
    this.code = code;
    this.status = status;
  }
}

export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

type HttpInit = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Provide one for mutating calls so retries cannot double-apply. */
  idempotencyKey?: string;
};

export async function http<T>(
  path: string,
  schema: z.ZodType<T>,
  init: HttpInit = {},
): Promise<T> {
  const { body, idempotencyKey, headers, ...rest } = init;
  const method = rest.method ?? (body === undefined ? "GET" : "POST");

  let res: Response;
  try {
    res = await fetch(path, {
      ...rest,
      method,
      headers: {
        "content-type": "application/json",
        ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new HttpError(
      "Could not reach the server. Check your connection and try again.",
      "NETWORK",
    );
  }

  if (!res.ok) {
    const parsed = ApiError.safeParse(await res.json().catch(() => null));
    throw new HttpError(
      parsed.success ? parsed.data.message : `Request failed (${res.status}).`,
      parsed.success ? parsed.data.code : "REQUEST_FAILED",
      res.status,
    );
  }

  const json = await res.json().catch(() => null);
  const out = schema.safeParse(json);
  if (!out.success) {
    throw new HttpError(
      "The server returned data the app could not read.",
      "SCHEMA_MISMATCH",
      res.status,
    );
  }
  return out.data;
}

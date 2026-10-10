import { keccak256, toBytes } from "viem";

/**
 * Canonical JSON + keccak256. The same recipe must run on the server and in the
 * contract (PRD §16: keccak256 over canonical JSON). Keys are sorted so the hash
 * is stable across engines.
 */
export function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      out[key] = sortValue((value as Record<string, unknown>)[key]);
    }
    return out;
  }
  return value;
}

export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

export function hashPayload(value: unknown): `0x${string}` {
  return keccak256(toBytes(canonicalJson(value)));
}

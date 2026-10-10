/**
 * Frontend configuration constants.
 * Values that the backend owns (thresholds, chain ids) live here so there is one
 * place to change when the team confirms them. See docs/DESIGN.md §9 (open items).
 */

/** Mock mode: the API client talks to mocks/ instead of real routes. */
export const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/** Kimi confidence below which an image decision is sent to human review. */
export const KIMI_CONFIDENCE_THRESHOLD = 0.7;

/** Trust copy that must appear wherever money is mentioned. */
export const TEST_TOKEN_NOTE = "Demo rewards are test tokens with no real value.";

/**
 * Monad testnet. VERIFY chain id, RPC and explorer against the Monad docs before
 * showing any real link. Source: docs.monad.xyz (testnet). Last checked: not yet.
 */
export const MONAD_TESTNET = {
  chainId: 10143,
  name: "Monad Testnet",
  rpcUrl: "https://testnet-rpc.monad.xyz",
  explorerUrl: "https://testnet.monadexplorer.com",
  /** Mock tx hashes resolve to this prefix so links never look like mainnet. */
  explorerTx: (hash: string) => `https://testnet.monadexplorer.com/tx/${hash}`,
} as const;

/** Human-readable, always testnet-labelled. */
export const EXPLORER_LABEL = "Monad testnet explorer";

/** Default frame rate when an asset does not report one (PRD §8). */
export const DEFAULT_FPS = 30;

/** A stated sample size below which we refuse to show a rate (PRD §9). */
export const MIN_SAMPLE_FOR_RATE = 20;

/**
 * Privy app id. Empty in the demo, so the login screen falls back to the mock role
 * picker. Set NEXT_PUBLIC_PRIVY_APP_ID to turn on real email and wallet sign-in
 * (AGENTS.md A5). There is no secret here: the app id is public by design.
 */
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";
export const HAS_PRIVY = PRIVY_APP_ID.trim().length > 0;

/** Video label palette keys, in canonical order (PRD §14). */
export const VIDEO_LABELS = [
  "reach",
  "grasp",
  "lift",
  "place",
  "inspect",
  "recover",
  "write",
  "other",
] as const;

export type VideoLabel = (typeof VIDEO_LABELS)[number];

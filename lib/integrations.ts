/**
 * Integrations actually wired into this build.
 *
 * The "Built with" row on the landing page renders from this list and nothing else.
 * A logo appears only when its integration is really present, so the row cannot
 * drift into implying a partnership that does not exist.
 *
 * `enabled` is the whole contract: turn it on when the integration is wired and
 * usable, not when it is merely planned. See docs/API-NEEDS.md.
 */
export type Integration = {
  id: string;
  name: string;
  /** What it actually does here. Shown as the caption, not a vague descriptor. */
  role: string;
  enabled: boolean;
};

export const INTEGRATIONS: Integration[] = [
  { id: "monad", name: "Monad", role: "Escrow and settlement", enabled: true },
  { id: "privy", name: "Privy", role: "Sign-in and wallet", enabled: true },
  { id: "kimi", name: "Kimi", role: "First-pass image review", enabled: true },
  { id: "vrf", name: "Chainlink VRF", role: "Audit sample seed", enabled: true },
  { id: "envio", name: "Envio", role: "Event indexing", enabled: false },
  { id: "ipfs", name: "IPFS", role: "Private media storage", enabled: false },
];

export const ENABLED_INTEGRATIONS = INTEGRATIONS.filter((i) => i.enabled);
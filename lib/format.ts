/** Formatting helpers for machine values and money. */

/** Shorten a hash or address for display: 0x9c…e2. Full value belongs in a HashChip. */
export function shortHash(value: string, lead = 4, tail = 2): string {
  if (!value) return "";
  if (value.length <= lead + tail + 1) return value;
  return `${value.slice(0, lead)}…${value.slice(-tail)}`;
}

/** Reward money. Always two decimals, tabular. Token name shown separately. */
export function formatAmount(value: number): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Milliseconds to HH:MM:SS:FF timecode (frame-accurate, PRD §8). */
export function msToTimecode(ms: number, fps: number): string {
  const totalSeconds = Math.max(0, ms) / 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const frames = Math.floor((totalSeconds - Math.floor(totalSeconds)) * fps);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(hours)}:${p(minutes)}:${p(seconds)}:${p(frames)}`;
}

/** Milliseconds to a compact seconds label for the timeline ruler: 4.0 s. */
export function msToSeconds(ms: number, digits = 1): string {
  return `${(ms / 1000).toFixed(digits)} s`;
}

/** Byte count to a short human string for exports. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ["KB", "MB", "GB"];
  let value = bytes / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i += 1;
  }
  return `${value.toFixed(1)} ${units[i]}`;
}

/** Countdown as MM:SS for the lease timer. */
export function msToCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

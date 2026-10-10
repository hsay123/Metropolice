import { IS_MOCK } from "@/lib/config";
import { realApi } from "@/lib/api/real";
import { mockApi } from "@/mocks/api";

/**
 * The single API entry point. Screens import `api` and never branch on mock
 * mode. `NEXT_PUBLIC_USE_MOCKS=true` swaps in the in-repo mock handlers.
 */
export const api: typeof realApi = IS_MOCK ? (mockApi as unknown as typeof realApi) : realApi;

export { resetDemo } from "@/mocks/api";

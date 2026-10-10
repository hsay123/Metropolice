"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, Wallet } from "lucide-react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PRIVY_APP_ID } from "@/lib/config";
import { ROLE_HOME, ROLE_LABEL } from "@/lib/roles";
import { Role } from "@/lib/api/types";
import { shortHash } from "@/lib/format";

/**
 * PrivySignIn — the real sign-in. Loaded only when NEXT_PUBLIC_PRIVY_APP_ID is
 * set, and only on the client (see login-panel.tsx), so the rest of the app never
 * pays for the Privy bundle. The role comes from the user's custom metadata and is
 * still checked by the server on every request (AGENTS.md A5).
 */
export function PrivySignIn() {
  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: { accentColor: "#1F4FE0", theme: "light" },
        loginMethods: ["email", "wallet"],
      }}
    >
      <PrivyInner />
    </PrivyProvider>
  );
}

function roleFromUser(user: { customMetadata?: unknown } | null | undefined): Role {
  const meta = user?.customMetadata as Record<string, unknown> | undefined;
  const parsed = Role.safeParse(meta?.role);
  return parsed.success ? parsed.data : "contributor";
}

function PrivyInner() {
  const { ready, authenticated, user, login, logout } = usePrivy();
  const router = useRouter();
  const role = roleFromUser(user);

  if (!ready) {
    return (
      <div className="flex flex-col gap-2" aria-busy>
        <Skeleton className="h-10 w-full rounded-[2px]" />
        <Skeleton className="h-4 w-40" />
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex flex-col gap-3">
        <Button type="button" onClick={() => login()} className="h-10 w-full justify-center">
          <Wallet aria-hidden />
          Sign in with email or wallet
        </Button>
        <p className="flex items-start gap-1.5 text-xs text-ink-muted">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Your sign-in is handled by Privy. The app never sees your password or your keys.
        </p>
      </div>
    );
  }

  const who =
    user?.email?.address ??
    (user?.wallet?.address ? shortHash(user.wallet.address) : (user?.id ?? "your account"));

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[6px] border border-rule bg-sheet px-4 py-3">
        <p className="text-xs text-ink-muted">Signed in as</p>
        <p className="machine mt-0.5 text-sm text-ink">{who}</p>
        <p className="mt-1 text-xs text-ink-muted">
          You will land on the {ROLE_LABEL[role].toLowerCase()} home.
        </p>
      </div>
      <Button
        type="button"
        className="h-10 w-full justify-center"
        onClick={() => router.push(ROLE_HOME[role])}
      >
        Continue to {ROLE_LABEL[role]}
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={() => logout()}>
        <LogOut aria-hidden />
        Use a different account
      </Button>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import type { PlanId } from "@/lib/plans";

export interface SessionInfo {
  plan: PlanId;
  runs_left: number | null;
  limit: number | null;
  period: "day" | "month";
  used: number;
  billing: "stripe" | "demo";
  demo_billing: boolean;
  has_portal: boolean;
}

export function useSession() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/session", { cache: "no-store" });
      if (res.ok) setSession(await res.json());
    } catch {
      /* offline — keep last known */
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { session, setSession, refresh };
}
